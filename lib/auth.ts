import { supabase, type Group, type Guest } from '../utils/supabase'
import { normalizeNameForMatching } from '../utils/nameNormalization'

export type AuthResult = {
  success: boolean
  group?: Group
  guests?: Guest[]
  error?: string
}

export async function authenticateGroup(password: string): Promise<AuthResult> {
  try {
    // Find group by password only
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('password', password)
      .single()

    if (groupError || !group) {
      return {
        success: false,
        error: 'Invalid password'
      }
    }

    // Get all guests in this group
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('*')
      .eq('group_id', group.id)
      .order('first_name')

    if (guestsError) {
      return {
        success: false,
        error: 'Error fetching group guests'
      }
    }

    return {
      success: true,
      group,
      guests: guests || []
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

export async function authenticateByName(firstName: string, lastName: string): Promise<AuthResult> {
  try {
    // Get all guests first since we need to do flexible name matching
    // We can't use ilike for accent/space normalization, so we filter in memory
    const { data: allGuests, error: allGuestsError } = await supabase
      .from('guests')
      .select(`
        *,
        groups:group_id (*)
      `)

    if (allGuestsError || !allGuests) {
      return {
        success: false,
        error: 'Error fetching guests'
      }
    }

    // Find guest using flexible name matching
    const normalizedFirstName = normalizeNameForMatching(firstName)
    const normalizedLastName = normalizeNameForMatching(lastName)
    
    const guest = allGuests.find(g => 
      normalizeNameForMatching(g.first_name) === normalizedFirstName &&
      normalizeNameForMatching(g.last_name) === normalizedLastName
    )

    if (!guest || !guest.groups) {
      return {
        success: false,
        error: 'Guest not found'
      }
    }

    const group = guest.groups as Group

    // Get all guests in this group
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('*')
      .eq('group_id', group.id)
      .order('first_name')

    if (guestsError) {
      return {
        success: false,
        error: 'Error fetching group guests'
      }
    }

    return {
      success: true,
      group,
      guests: guests || []
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

export async function getGroupGuests(groupId: string): Promise<Guest[]> {
  try {
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('group_id', groupId)
      .order('first_name')

    if (error) {
      console.error('Error fetching group guests:', error)
      return []
    }

    return guests || []
  } catch (error) {
    console.error('Error fetching group guests:', error)
    return []
  }
}