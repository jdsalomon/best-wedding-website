const express = require('express')
const router = express.Router()
const database = require('../utils/database')
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Smart grouping wizard system
 * Sequential processing: one group at a time until all guests are grouped
 */

// GET /api/grouping/next-suggestion - Get next group suggestion for wizard
router.get('/next-suggestion', async (req, res) => {
  try {
    const suggestion = await getNextGroupSuggestion()
    
    if (!suggestion) {
      return res.json({
        success: true,
        data: null,
        message: 'All guests have been grouped!'
      })
    }
    
    res.json({
      success: true,
      data: suggestion
    })
  } catch (error) {
    console.error('Error getting next group suggestion:', error)
    res.status(500).json({
      success: false,
      message: 'Error generating next group suggestion'
    })
  }
})

// GET /api/grouping/progress - Get grouping progress stats
router.get('/progress', async (req, res) => {
  try {
    const progress = await getGroupingProgress()
    res.json({
      success: true,
      data: progress
    })
  } catch (error) {
    console.error('Error getting grouping progress:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting progress'
    })
  }
})

// GET /api/grouping/search-guests/:query - Search ungrouped guests
router.get('/search-guests/:query', async (req, res) => {
  try {
    const { query } = req.params
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      })
    }

    const guests = await searchUngroupedGuests(query.trim())
    
    res.json({
      success: true,
      data: guests
    })
  } catch (error) {
    console.error('Error searching guests:', error)
    res.status(500).json({
      success: false,
      message: 'Error searching guests'
    })
  }
})

// POST /api/grouping/wizard-create-group - Create group from wizard
router.post('/wizard-create-group', async (req, res) => {
  try {
    const { name, password, guestIds, misc } = req.body
    
    if (!name || !password || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Group name, password, and guest IDs are required'
      })
    }

    // Create the group and assign guests
    const group = await createGroupAndAssignGuests(name, password, guestIds, misc)
    
    // Get the next suggestion for continuation
    const nextSuggestion = await getNextGroupSuggestion()
    
    res.json({
      success: true,
      data: {
        createdGroup: group,
        nextSuggestion: nextSuggestion
      },
      message: `Group "${name}" created with ${guestIds.length} guests`
    })
  } catch (error) {
    console.error('Error creating group from wizard:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// GET /api/grouping/suggestions - Get smart grouping suggestions (legacy)
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = await generateGroupSuggestions()
    
    res.json({
      success: true,
      data: suggestions,
      stats: {
        totalSuggestions: suggestions.length,
        potentialGroups: suggestions.filter(s => s.guests.length > 1).length
      }
    })
  } catch (error) {
    console.error('Error getting grouping suggestions:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error generating suggestions' 
    })
  }
})

// POST /api/grouping/create-group - Create group with selected guests
router.post('/create-group', async (req, res) => {
  try {
    const { name, password, guestIds } = req.body
    
    if (!name || !password || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Group name, password, and guest IDs are required'
      })
    }

    // Validate all guests exist and are ungrouped
    const guests = await validateGuestsForGrouping(guestIds)
    if (guests.length !== guestIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some guests are invalid or already grouped'
      })
    }

    // Ensure +1s are included with their main guests
    const completeGuestIds = await ensurePlusOnesIncluded(guestIds)

    // Create the group
    const group = await database.createGroup({
      name,
      password,
      misc: 'Created via smart grouping'
    })

    // Assign guests to group
    await database.assignGuestsToGroup(completeGuestIds, group.id)

    // Get complete group data
    const completeGroup = await database.getGroupById(group.id)

    res.json({
      success: true,
      data: completeGroup,
      message: `Group "${name}" created with ${completeGuestIds.length} guests`
    })
  } catch (error) {
    console.error('Error creating group:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// GET /api/grouping/ungrouped-guests - Get all ungrouped guests
router.get('/ungrouped-guests', async (req, res) => {
  try {
    const ungroupedGuests = await getUngroupedGuestsWithPlusOnes()
    
    res.json({
      success: true,
      data: ungroupedGuests,
      stats: {
        totalUngrouped: ungroupedGuests.length,
        mainGuests: ungroupedGuests.filter(g => !g.plus_one_of).length,
        plusOnes: ungroupedGuests.filter(g => g.plus_one_of).length
      }
    })
  } catch (error) {
    console.error('Error getting ungrouped guests:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching ungrouped guests'
    })
  }
})

// GET /api/grouping/search - Search guests for manual grouping
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      })
    }

    const searchResults = await searchGuestsForGrouping(query.trim())
    
    res.json({
      success: true,
      data: searchResults,
      message: `Found ${searchResults.length} guests matching "${query}"`
    })
  } catch (error) {
    console.error('Error searching guests:', error)
    res.status(500).json({
      success: false,
      message: 'Error searching guests'
    })
  }
})

/**
 * Generate smart group suggestions based on last name + source
 */
async function generateGroupSuggestions() {
  try {
    const { data: client } = await database.getSupabaseClient()
    
    // Get all ungrouped guests
    const { data: ungroupedGuests } = await client
      .from('guests')
      .select('*')
      .is('group_id', null)
      .order('last_name', { ascending: true })

    if (!ungroupedGuests || ungroupedGuests.length === 0) {
      return []
    }

    // Group by last_name + source combination
    const groupMap = new Map()
    
    ungroupedGuests.forEach(guest => {
      const key = `${guest.last_name.toLowerCase()}_${guest.source.toLowerCase()}`
      
      if (!groupMap.has(key)) {
        groupMap.set(key, [])
      }
      groupMap.get(key).push(guest)
    })

    // Generate suggestions for groups with potential
    const suggestions = []
    
    groupMap.forEach((mainGuests, key) => {
      const [lastName, source] = key.split('_')
      
      // Find all guests (including +1s) that would be in this group
      const allGuests = []
      
      mainGuests.forEach(mainGuest => {
        allGuests.push(mainGuest)
        
        // Find their +1
        const plusOne = ungroupedGuests.find(g => g.plus_one_of === mainGuest.id)
        if (plusOne) {
          allGuests.push(plusOne)
        }
      })

      suggestions.push({
        id: `suggestion_${key}`,
        suggestedName: mainGuests.length === 1 && !allGuests.find(g => g.plus_one_of) 
          ? `${mainGuests[0].first_name} ${mainGuests[0].last_name}`
          : `${capitalizeFirst(lastName)} Family`,
        suggestedPassword: lastName.toLowerCase(),
        guests: allGuests,
        reason: mainGuests.length > 1 
          ? `${mainGuests.length} guests with last name "${capitalizeFirst(lastName)}" from source "${capitalizeFirst(source)}"`
          : `Single guest from source "${capitalizeFirst(source)}"`,
        lastName: capitalizeFirst(lastName),
        source: capitalizeFirst(source),
        priority: mainGuests.length > 1 ? 'high' : 'low'
      })
    })

    // Sort by priority (multi-guest suggestions first)
    suggestions.sort((a, b) => {
      if (a.priority === 'high' && b.priority === 'low') return -1
      if (a.priority === 'low' && b.priority === 'high') return 1
      return b.guests.length - a.guests.length
    })

    return suggestions
  } catch (error) {
    console.error('Error generating group suggestions:', error)
    throw error
  }
}

/**
 * Get ungrouped guests with their +1 relationships visible
 */
async function getUngroupedGuestsWithPlusOnes() {
  try {
    const { data: client } = await database.getSupabaseClient()
    
    const { data: guests } = await client
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        source,
        plus_one_of,
        phone,
        email,
        misc,
        created_at
      `)
      .is('group_id', null)
      .order('last_name', { ascending: true })

    return guests || []
  } catch (error) {
    console.error('Error getting ungrouped guests:', error)
    throw error
  }
}

/**
 * Search guests for manual grouping
 */
async function searchGuestsForGrouping(query) {
  try {
    const { data: client } = await database.getSupabaseClient()
    
    const { data: guests } = await client
      .from('guests')
      .select('*')
      .is('group_id', null)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,source.ilike.%${query}%`)
      .order('last_name', { ascending: true })

    return guests || []
  } catch (error) {
    console.error('Error searching guests:', error)
    throw error
  }
}

/**
 * Validate guests exist and are ungrouped
 */
async function validateGuestsForGrouping(guestIds) {
  try {
    const { data: client } = await database.getSupabaseClient()
    
    const { data: guests } = await client
      .from('guests')
      .select('*')
      .in('id', guestIds)
      .is('group_id', null)

    return guests || []
  } catch (error) {
    console.error('Error validating guests:', error)
    throw error
  }
}

/**
 * Ensure +1s are included when their main guest is selected
 */
async function ensurePlusOnesIncluded(guestIds) {
  try {
    const { data: client } = await database.getSupabaseClient()
    
    // Get the selected guests
    const { data: selectedGuests } = await client
      .from('guests')
      .select('*')
      .in('id', guestIds)

    const completeIds = [...guestIds]

    // For each selected guest, check if they have a +1
    for (const guest of selectedGuests) {
      if (!guest.plus_one_of) { // This is a main guest
        const { data: plusOnes } = await client
          .from('guests')
          .select('id')
          .eq('plus_one_of', guest.id)
          .is('group_id', null)

        if (plusOnes && plusOnes.length > 0) {
          plusOnes.forEach(plusOne => {
            if (!completeIds.includes(plusOne.id)) {
              completeIds.push(plusOne.id)
            }
          })
        }
      }
    }

    // Also check if any selected guests are +1s, ensure their main guest is included
    for (const guest of selectedGuests) {
      if (guest.plus_one_of && !completeIds.includes(guest.plus_one_of)) {
        completeIds.push(guest.plus_one_of)
      }
    }

    return completeIds
  } catch (error) {
    console.error('Error ensuring +1s included:', error)
    throw error
  }
}

/**
 * SMART GROUPING WIZARD FUNCTIONS
 */

/**
 * Get the next group suggestion for the wizard
 */
async function getNextGroupSuggestion() {
  try {
    // Find the first ungrouped guest (including +1s)
    const { data: nextGuest } = await supabase
      .from('guests')
      .select('*')
      .is('group_id', null)
      .order('last_name', { ascending: true })
      .limit(1)
      .single()

    if (!nextGuest) {
      return null // All guests are grouped
    }

    // Build the suggested group
    const suggestedGroup = {
      mainGuest: nextGuest,
      suggestedMembers: [],
      autoGeneratedName: '',
      autoGeneratedPassword: '',
      stats: {
        totalMembers: 0,
        mainGuests: 0,
        plusOnes: 0
      }
    }

    const memberIds = new Set([nextGuest.id])
    const members = [nextGuest]

    // 1. Include main guest's +1 automatically
    const { data: mainGuestPlusOne } = await supabase
      .from('guests')
      .select('*')
      .eq('plus_one_of', nextGuest.id)
      .is('group_id', null)
      .maybeSingle()

    if (mainGuestPlusOne) {
      members.push(mainGuestPlusOne)
      memberIds.add(mainGuestPlusOne.id)
    }

    // 2. Find all guests with same source + last name as main guest
    const { data: sameLastNameGuests } = await supabase
      .from('guests')
      .select('*')
      .eq('source', nextGuest.source)
      .eq('last_name', nextGuest.last_name)
      .is('group_id', null)
      .neq('id', nextGuest.id)

    if (sameLastNameGuests) {
      for (const guest of sameLastNameGuests) {
        if (!memberIds.has(guest.id)) {
          members.push(guest)
          memberIds.add(guest.id)

          // Include their +1s too
          const { data: guestPlusOne } = await supabase
            .from('guests')
            .select('*')
            .eq('plus_one_of', guest.id)
            .is('group_id', null)
            .maybeSingle()

          if (guestPlusOne && !memberIds.has(guestPlusOne.id)) {
            members.push(guestPlusOne)
            memberIds.add(guestPlusOne.id)
          }
        }
      }
    }

    // 3. If main guest has +1, find guests with same source + +1's last name
    if (mainGuestPlusOne && mainGuestPlusOne.last_name !== nextGuest.last_name) {
      const { data: plusOneLastNameGuests } = await supabase
        .from('guests')
        .select('*')
        .eq('source', nextGuest.source)
        .eq('last_name', mainGuestPlusOne.last_name)
        .is('group_id', null)

      if (plusOneLastNameGuests) {
        for (const guest of plusOneLastNameGuests) {
          if (!memberIds.has(guest.id)) {
            members.push(guest)
            memberIds.add(guest.id)

            // Include their +1s
            const { data: guestPlusOne } = await supabase
              .from('guests')
              .select('*')
              .eq('plus_one_of', guest.id)
              .is('group_id', null)
              .maybeSingle()

            if (guestPlusOne && !memberIds.has(guestPlusOne.id)) {
              members.push(guestPlusOne)
              memberIds.add(guestPlusOne.id)
            }
          }
        }
      }
    }

    // Sort members: main guest first, then others by name
    members.sort((a, b) => {
      if (a.id === nextGuest.id) return -1
      if (b.id === nextGuest.id) return 1
      if (a.plus_one_of && !b.plus_one_of) return 1
      if (!a.plus_one_of && b.plus_one_of) return -1
      return a.last_name.localeCompare(b.last_name)
    })

    // Generate group name and password
    const familyName = nextGuest.last_name
    const groupName = members.length === 1 ? 
      `${nextGuest.first_name} ${nextGuest.last_name}` :
      `${familyName} Family`
    
    const password = generateGroupPassword(familyName)

    // Calculate stats
    const mainGuestCount = members.filter(m => !m.plus_one_of).length
    const plusOneCount = members.filter(m => m.plus_one_of).length

    return {
      mainGuest: nextGuest,
      suggestedMembers: members,
      autoGeneratedName: groupName,
      autoGeneratedPassword: password,
      stats: {
        totalMembers: members.length,
        mainGuests: mainGuestCount,
        plusOnes: plusOneCount
      }
    }

  } catch (error) {
    console.error('Error getting next group suggestion:', error)
    throw error
  }
}

/**
 * Get grouping progress statistics
 */
async function getGroupingProgress() {
  try {
    // Count total guests
    const { count: totalGuests } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })

    // Count grouped guests
    const { count: groupedGuests } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .not('group_id', 'is', null)

    // Count all ungrouped guests (including +1s)
    const { count: ungroupedGuests } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .is('group_id', null)

    const remainingGuests = (totalGuests || 0) - (groupedGuests || 0)
    const progressPercentage = totalGuests > 0 ? 
      Math.round(((groupedGuests || 0) / totalGuests) * 100) : 0

    return {
      totalGuests: totalGuests || 0,
      groupedGuests: groupedGuests || 0,
      remainingGuests,
      ungroupedMainGuests: ungroupedGuests || 0, // Kept for compatibility
      progressPercentage,
      isComplete: remainingGuests === 0
    }
  } catch (error) {
    console.error('Error getting grouping progress:', error)
    throw error
  }
}

/**
 * Search ungrouped guests for manual addition
 */
async function searchUngroupedGuests(query) {
  try {
    const { data: guests } = await supabase
      .from('guests')
      .select('*')
      .is('group_id', null)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,source.ilike.%${query}%`)
      .order('last_name', { ascending: true })
      .limit(20)

    return guests || []
  } catch (error) {
    console.error('Error searching ungrouped guests:', error)
    throw error
  }
}

/**
 * Create group and assign all selected guests
 */
async function createGroupAndAssignGuests(name, password, guestIds, misc) {
  try {
    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        password,
        misc: misc || 'Created via smart grouping wizard'
      })
      .select()
      .single()

    if (groupError) throw groupError

    // Assign all guests to the group
    const { error: updateError } = await supabase
      .from('guests')
      .update({ group_id: group.id })
      .in('id', guestIds)

    if (updateError) throw updateError

    // Return the group with guest count
    return {
      ...group,
      guestCount: guestIds.length
    }
  } catch (error) {
    console.error('Error creating group and assigning guests:', error)
    throw error
  }
}

/**
 * Generate secure password for group
 */
function generateGroupPassword(lastName) {
  const salt = Math.floor(Math.random() * 999) + 100 // 3-digit number
  return `${lastName.toLowerCase()}${salt}`
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = router