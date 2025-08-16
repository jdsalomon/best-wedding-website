const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Guest CRUD operations
async function getAllGuests() {
  try {
    const { data: guests, error } = await supabase
      .from('guests')
      .select(`
        *,
        groups (
          id,
          name
        )
      `)
      .order('last_name', { ascending: true })

    if (error) throw error
    return guests || []
  } catch (error) {
    console.error('Error fetching guests:', error)
    return []
  }
}

async function getGuestById(id) {
  try {
    const { data: guest, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return guest
  } catch (error) {
    console.error('Error fetching guest:', error)
    return null
  }
}

async function createGuest(guestData) {
  try {
    const { data: guest, error } = await supabase
      .from('guests')
      .insert([{
        first_name: guestData.first_name,
        last_name: guestData.last_name,
        phone: guestData.phone || null,
        email: guestData.email || null,
        address: guestData.address || null,
        misc: guestData.misc || null,
        group_id: guestData.group_id || null
      }])
      .select()
      .single()

    if (error) throw error
    return guest
  } catch (error) {
    console.error('Error creating guest:', error)
    throw error
  }
}

async function updateGuest(id, guestData) {
  try {
    const { data: guest, error } = await supabase
      .from('guests')
      .update({
        first_name: guestData.first_name,
        last_name: guestData.last_name,
        phone: guestData.phone || null,
        email: guestData.email || null,
        address: guestData.address || null,
        misc: guestData.misc || null,
        group_id: guestData.group_id || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return guest
  } catch (error) {
    console.error('Error updating guest:', error)
    throw error
  }
}

async function deleteGuest(id) {
  try {
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting guest:', error)
    throw error
  }
}

// Group CRUD operations
async function getAllGroups() {
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        *,
        guests (
          id,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .order('name', { ascending: true })

    if (error) throw error
    return groups || []
  } catch (error) {
    console.error('Error fetching groups:', error)
    return []
  }
}

async function getGroupById(id) {
  try {
    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        *,
        guests (
          id,
          first_name,
          last_name,
          phone,
          email,
          address,
          misc
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return group
  } catch (error) {
    console.error('Error fetching group:', error)
    return null
  }
}

async function createGroup(groupData) {
  try {
    const { data: group, error } = await supabase
      .from('groups')
      .insert([{
        name: groupData.name,
        password: groupData.password,
        misc: groupData.misc || null
      }])
      .select()
      .single()

    if (error) throw error
    return group
  } catch (error) {
    console.error('Error creating group:', error)
    throw error
  }
}

async function updateGroup(id, groupData) {
  try {
    const { data: group, error } = await supabase
      .from('groups')
      .update({
        name: groupData.name,
        password: groupData.password,
        misc: groupData.misc || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return group
  } catch (error) {
    console.error('Error updating group:', error)
    throw error
  }
}

async function deleteGroup(id) {
  try {
    // First, set all guests in this group to have no group
    await supabase
      .from('guests')
      .update({ group_id: null })
      .eq('group_id', id)

    // Then delete the group
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting group:', error)
    throw error
  }
}

// Search and utility functions
async function searchGuests(query) {
  try {
    const { data: guests, error } = await supabase
      .from('guests')
      .select(`
        *,
        groups (
          id,
          name
        )
      `)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .order('last_name', { ascending: true })

    if (error) throw error
    return guests || []
  } catch (error) {
    console.error('Error searching guests:', error)
    return []
  }
}

async function getUngroupedGuests() {
  try {
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .is('group_id', null)
      .order('last_name', { ascending: true })

    if (error) throw error
    return guests || []
  } catch (error) {
    console.error('Error fetching ungrouped guests:', error)
    return []
  }
}

async function getSuggestedGuestsForGrouping(lastName, source) {
  try {
    // Find guests with the same last name who are not in a group
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('last_name', lastName)
      .is('group_id', null)
      .order('first_name', { ascending: true })

    if (error) throw error
    return guests || []
  } catch (error) {
    console.error('Error fetching suggested guests:', error)
    return []
  }
}

async function assignGuestsToGroup(guestIds, groupId) {
  try {
    const { data: guests, error } = await supabase
      .from('guests')
      .update({ group_id: groupId })
      .in('id', guestIds)
      .select()

    if (error) throw error
    return guests || []
  } catch (error) {
    console.error('Error assigning guests to group:', error)
    throw error
  }
}

// Contact coverage analysis
async function getContactCoverage() {
  try {
    const groups = await getAllGroups()
    
    const coverage = groups.map(group => {
      const hasPhone = group.guests.some(guest => guest.phone && guest.phone.trim() !== '')
      const hasEmail = group.guests.some(guest => guest.email && guest.email.trim() !== '')
      
      return {
        groupId: group.id,
        groupName: group.name,
        guestCount: group.guests.length,
        hasPhone,
        hasEmail,
        hasContact: hasPhone || hasEmail,
        contactTypes: {
          phone: hasPhone,
          email: hasEmail
        }
      }
    })

    const stats = {
      totalGroups: coverage.length,
      groupsWithContact: coverage.filter(g => g.hasContact).length,
      groupsWithoutContact: coverage.filter(g => !g.hasContact).length,
      groupsWithPhone: coverage.filter(g => g.hasPhone).length,
      groupsWithEmail: coverage.filter(g => g.hasEmail).length
    }

    return { coverage, stats }
  } catch (error) {
    console.error('Error calculating contact coverage:', error)
    throw error
  }
}

// Password generation utility
function generatePassword(lastName) {
  // Generate a simple password based on the last name
  // Convert to lowercase and remove spaces/special characters
  return lastName.toLowerCase().replace(/[^a-z]/g, '')
}

// Group Contact Management Functions

/**
 * Determine the principal guest for a group (whose contact info represents the group)
 * Priority: 1) Guest with contact info, 2) Main guest (not +1), 3) First guest
 */
async function getGroupPrincipal(groupId) {
  try {
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('group_id', groupId)
      .order('last_name', { ascending: true })

    if (error || !guests || guests.length === 0) {
      throw new Error('No guests found for group')
    }

    // Priority 1: Guest with existing contact info (phone or email)
    const guestWithContact = guests.find(guest => 
      (guest.phone && guest.phone.trim() !== '') || 
      (guest.email && guest.email.trim() !== '')
    )
    if (guestWithContact) return guestWithContact

    // Priority 2: Main guest (not a +1)
    const mainGuest = guests.find(guest => !guest.plus_one_of)
    if (mainGuest) return mainGuest

    // Priority 3: First guest alphabetically
    return guests[0]
  } catch (error) {
    console.error('Error determining group principal:', error)
    throw error
  }
}

/**
 * Update group contact info by updating the principal guest's contact
 */
async function updateGroupContact(groupId, contactData) {
  try {
    const principal = await getGroupPrincipal(groupId)
    
    const updateData = {
      phone: contactData.phone || null,
      email: contactData.email || null,
      address: contactData.address || null
    }

    const { data, error } = await supabase
      .from('guests')
      .update(updateData)
      .eq('id', principal.id)
      .select()
      .single()

    if (error) throw error
    return { principal, updatedGuest: data }
  } catch (error) {
    console.error('Error updating group contact:', error)
    throw error
  }
}

/**
 * Get aggregated contact information for a group
 */
async function getGroupContactInfo(groupId) {
  try {
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, phone, email, address, plus_one_of')
      .eq('group_id', groupId)
      .order('last_name', { ascending: true })

    if (error) throw error

    const principal = await getGroupPrincipal(groupId)
    
    // Collect all contact info from group members
    const allContacts = {
      phones: guests.filter(g => g.phone && g.phone.trim() !== '').map(g => ({
        name: `${g.first_name} ${g.last_name}`,
        phone: g.phone,
        isPrincipal: g.id === principal.id
      })),
      emails: guests.filter(g => g.email && g.email.trim() !== '').map(g => ({
        name: `${g.first_name} ${g.last_name}`,
        email: g.email,
        isPrincipal: g.id === principal.id
      })),
      addresses: guests.filter(g => g.address && g.address.trim() !== '').map(g => ({
        name: `${g.first_name} ${g.last_name}`,
        address: g.address,
        isPrincipal: g.id === principal.id
      }))
    }

    return {
      principal: {
        id: principal.id,
        name: `${principal.first_name} ${principal.last_name}`,
        phone: principal.phone || null,
        email: principal.email || null,
        address: principal.address || null
      },
      allContacts,
      hasAnyContact: allContacts.phones.length > 0 || allContacts.emails.length > 0 || allContacts.addresses.length > 0
    }
  } catch (error) {
    console.error('Error getting group contact info:', error)
    throw error
  }
}

module.exports = {
  // Guest operations
  getAllGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  
  // Group operations
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  
  // Search and utilities
  searchGuests,
  getUngroupedGuests,
  getSuggestedGuestsForGrouping,
  assignGuestsToGroup,
  getContactCoverage,
  generatePassword,
  
  // Group contact management
  getGroupPrincipal,
  updateGroupContact,
  getGroupContactInfo
}