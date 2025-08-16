const fs = require('fs')
const Papa = require('papaparse')
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Simple direct CSV import to database
 * No staging, no guest units - just clean database operations
 */
async function importCSVDirectly(filePath, progressCallback) {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf8')
    
    // Auto-detect delimiter (comma or semicolon)
    const sampleLine = csvContent.split('\n')[0] || ''
    const semicolonCount = (sampleLine.match(/;/g) || []).length
    const commaCount = (sampleLine.match(/,/g) || []).length
    const delimiter = semicolonCount > commaCount ? ';' : ','
    
    console.log(`🔍 Direct Import: Detected delimiter "${delimiter}"`)
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      delimiter: delimiter,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const normalized = header.toLowerCase().trim()
        const headerMap = {
          'first name': 'first_name',
          'last name': 'last_name',
          '+1 first name': 'plus_one_first_name',
          '+1 last name': 'plus_one_last_name',
          'first_name+1': 'plus_one_first_name',
          'last_name+1': 'plus_one_last_name',
          'plus one first name': 'plus_one_first_name',
          'plus one last name': 'plus_one_last_name'
        }
        return headerMap[normalized] || normalized
      }
    })

    if (parseResult.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parseResult.errors.map(e => e.message).join(', ')}`)
    }

    const results = {
      totalRows: parseResult.data.length,
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: []
    }

    console.log(`📊 Direct Import: Processing ${results.totalRows} rows`)
    
    // Determine source name from file path
    const sourceName = filePath.split('/').pop().replace(/\.[^/.]+$/, "") || 'unknown'
    
    // Process each row directly
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i]
      
      // Progress callback
      if (progressCallback) {
        await progressCallback({
          current: i + 1,
          total: results.totalRows,
          percentage: Math.round(((i + 1) / results.totalRows) * 100)
        })
      }

      try {
        await processRowDirectly(row, sourceName, results)
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        results.errors.push(`Row ${i + 1}: ${error.message}`)
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath)
    
    console.log(`✅ Direct Import Complete:`)
    console.log(`   📊 Total rows: ${results.totalRows}`)
    console.log(`   ✅ Imported: ${results.imported}`)
    console.log(`   ⚠️ Skipped: ${results.skipped}`)
    console.log(`   🔄 Duplicates: ${results.duplicates}`)
    console.log(`   ❌ Errors: ${results.errors.length}`)
    
    return results
  } catch (error) {
    console.error('Direct import error:', error)
    // Clean up file on error
    try {
      fs.unlinkSync(filePath)
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError)
    }
    throw error
  }
}

/**
 * Process a single CSV row and insert directly into database
 */
async function processRowDirectly(row, sourceName, results) {
  // Validate required fields
  if (!row.first_name || !row.last_name) {
    results.skipped++
    return
  }

  // Trim whitespace
  Object.keys(row).forEach(key => {
    if (typeof row[key] === 'string') {
      row[key] = row[key].trim()
    }
  })

  const source = row.source || sourceName

  try {
    // Insert main guest with ON CONFLICT handling
    const mainGuestData = {
      first_name: row.first_name,
      last_name: row.last_name,
      source: source,
      phone: null,
      email: null,
      address: null,
      misc: `Imported from CSV: ${source}`,
      group_id: null,
      plus_one_of: null
    }

    const mainGuest = await insertGuestWithDuplicateHandling(mainGuestData, results)
    
    // Insert +1 if present (process even if main guest was duplicate)
    console.log(`🔍 Checking +1 for ${row.first_name} ${row.last_name}:`, {
      plus_one_first_name: row.plus_one_first_name,
      plus_one_last_name: row.plus_one_last_name,
      hasMainGuest: !!mainGuest
    })
    
    if ((row.plus_one_first_name && row.plus_one_first_name.trim()) || 
        (row.plus_one_last_name && row.plus_one_last_name.trim())) {
      console.log(`✅ Processing +1: ${row.plus_one_first_name} ${row.plus_one_last_name}`)
      let mainGuestId = mainGuest?.id
      
      // If main guest was duplicate, find the existing guest ID
      if (!mainGuest) {
        console.log(`🔍 Main guest was duplicate, finding existing ID...`)
        const { data: existingGuest } = await supabase
          .from('guests')
          .select('id')
          .eq('first_name', row.first_name)
          .eq('last_name', row.last_name)
          .eq('source', source)
          .single()
        
        mainGuestId = existingGuest?.id
        console.log(`📍 Found existing main guest ID:`, mainGuestId)
      }
      
      // Only create +1 if we have a main guest ID
      if (mainGuestId) {
        console.log(`👫 Creating +1 relationship for ID:`, mainGuestId)
        const plusOneData = {
          first_name: row.plus_one_first_name?.trim() || 'Unknown',
          last_name: row.plus_one_last_name?.trim() || '',
          source: source,
          phone: null,
          email: null,
          address: null,
          misc: `Imported from CSV: ${source} (+1 for ${row.first_name} ${row.last_name})`,
          group_id: null,
          plus_one_of: mainGuestId
        }

        const plusOneResult = await insertGuestWithDuplicateHandling(plusOneData, results)
        console.log(`🎯 +1 insert result:`, plusOneResult ? 'SUCCESS' : 'FAILED/DUPLICATE')
      } else {
        console.log(`❌ No main guest ID found for +1`)
      }
    } else {
      console.log(`⚪ No +1 data for ${row.first_name} ${row.last_name}`)
    }
    
  } catch (error) {
    console.error('Error processing row:', error)
    throw error
  }
}

/**
 * Insert guest with duplicate handling using ON CONFLICT
 */
async function insertGuestWithDuplicateHandling(guestData, results) {
  try {
    // Try to insert the guest
    const { data, error } = await supabase
      .from('guests')
      .insert(guestData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log(`⚠️ Duplicate guest: ${guestData.first_name} ${guestData.last_name} from ${guestData.source}`)
        results.duplicates++
        return null
      } else {
        throw error
      }
    }

    results.imported++
    return data
  } catch (error) {
    console.error('Error inserting guest:', error)
    throw error
  }
}

/**
 * Get import statistics
 */
async function getImportStats() {
  try {
    // Get total guests
    const { count: totalGuests } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })

    // Get guests by source
    const { data: sourceStats } = await supabase
      .from('guests')
      .select('source')
      .not('source', 'is', null)

    const sourceGroups = {}
    sourceStats?.forEach(guest => {
      sourceGroups[guest.source] = (sourceGroups[guest.source] || 0) + 1
    })

    // Get +1 relationships count
    const { count: plusOnes } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .not('plus_one_of', 'is', null)

    return {
      totalGuests: totalGuests || 0,
      sourceBreakdown: sourceGroups,
      plusOneCount: plusOnes || 0
    }
  } catch (error) {
    console.error('Error getting import stats:', error)
    throw error
  }
}

module.exports = {
  importCSVDirectly,
  getImportStats
}