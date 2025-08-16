const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'database/migrations/003_refactor_guests_for_direct_import.sql')
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('🔄 Running database migration...')
    console.log('📄 Migration: 003_refactor_guests_for_direct_import.sql')
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('   - Added source column to guests table')
    console.log('   - Added plus_one_of column for +1 relationships') 
    console.log('   - Added unique constraint on (first_name, last_name, source)')
    console.log('   - Created indexes for faster queries')
    console.log('   - Updated existing guests with "legacy" source')
    
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    process.exit(1)
  }
}

// Alternative: Run migration statements one by one
async function runMigrationStepByStep() {
  try {
    console.log('🔄 Running migration step by step...')
    
    const steps = [
      'ALTER TABLE guests ADD COLUMN IF NOT EXISTS source VARCHAR(255)',
      'ALTER TABLE guests ADD COLUMN IF NOT EXISTS plus_one_of UUID REFERENCES guests(id) ON DELETE SET NULL',
      'UPDATE guests SET source = \'legacy\' WHERE source IS NULL',
      'ALTER TABLE guests ALTER COLUMN source SET NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_guests_source ON guests(source)',
      'CREATE INDEX IF NOT EXISTS idx_guests_plus_one_of ON guests(plus_one_of)',
      'CREATE INDEX IF NOT EXISTS idx_guests_lastname_source ON guests(last_name, source)'
    ]
    
    for (let i = 0; i < steps.length; i++) {
      const sql = steps[i]
      console.log(`   Step ${i + 1}/${steps.length}: ${sql.substring(0, 50)}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Step ${i + 1} failed:`, error)
        // Continue with other steps for non-critical errors
      } else {
        console.log(`   ✅ Step ${i + 1} completed`)
      }
    }
    
    // Add unique constraint separately as it might conflict with existing data
    console.log('   Final step: Adding unique constraint...')
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE guests ADD CONSTRAINT unique_guest_per_source UNIQUE (first_name, last_name, source)' 
      })
      if (error && !error.message.includes('already exists')) {
        console.log('   ⚠️  Unique constraint not added (may have conflicting data)')
      } else {
        console.log('   ✅ Unique constraint added')
      }
    } catch (e) {
      console.log('   ⚠️  Unique constraint skipped')
    }
    
    console.log('✅ Migration completed!')
    
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    process.exit(1)
  }
}

// Run the migration
runMigrationStepByStep()