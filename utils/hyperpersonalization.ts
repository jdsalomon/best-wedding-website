import { supabase } from './supabase'

export interface Guest {
  id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
  address?: string
  misc?: string
  source?: string
  plus_one_of?: string
}

export interface GroupContext {
  groupName: string
  guestCount: number
  members: Guest[]
  groupNotes?: string
  groupLanguage?: string
  currentUser?: Guest
}

/**
 * Fetch comprehensive group data for hyperpersonalization
 */
export async function getGroupContext(groupId: string, currentUserId?: string, groupLanguage?: string): Promise<GroupContext | null> {
  try {
    // Fetch group details with all guests
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        misc,
        guests (
          id,
          first_name,
          last_name,
          phone,
          email,
          address,
          misc,
          source,
          plus_one_of,
          preferred_language
        )
      `)
      .eq('id', groupId)
      .single()

    if (groupError || !groupData) {
      console.error('Error fetching group context:', groupError)
      return null
    }

    // Get all members (unified list)
    const allMembers = groupData.guests

    // Find current user if provided
    const currentUser = currentUserId ? allMembers.find(guest => guest.id === currentUserId) : undefined

    return {
      groupName: groupData.name,
      guestCount: groupData.guests.length,
      members: allMembers,
      groupNotes: groupData.misc || undefined,
      groupLanguage: groupLanguage || currentUser?.preferred_language || 'French', // Use current user's language
      currentUser
    }

  } catch (error) {
    console.error('Error building group context:', error)
    return null
  }
}

/**
 * Process hyperpersonalization template with group context data
 */
export function processHyperpersonalizationTemplate(template: string, context: GroupContext): string {
  const memberNames = context.members.map(g => `${g.first_name} ${g.last_name}`).join(', ')
  const groupNotesSection = context.groupNotes 
    ? `- **Special Notes**: "${context.groupNotes}"`
    : ''
  const currentUserName = context.currentUser 
    ? `${context.currentUser.first_name} ${context.currentUser.last_name}`
    : context.groupName
  
  return template
    .replace(/\{\{GROUP_NAME\}\}/g, context.groupName)
    .replace(/\{\{GUEST_COUNT\}\}/g, context.guestCount.toString())
    .replace(/\{\{GUEST_COUNT_PLURAL\}\}/g, context.guestCount !== 1 ? 's' : '')
    .replace(/\{\{MEMBERS\}\}/g, memberNames)
    .replace(/\{\{GROUP_NOTES\}\}/g, groupNotesSection)
    .replace(/\{\{CURRENT_USER_NAME\}\}/g, currentUserName)
    .replace(/\{\{GROUP_LANGUAGE\}\}/g, context.groupLanguage || 'French')
}

/**
 * Generate personalized system prompt addition based on group context
 * @deprecated Use processHyperpersonalizationTemplate instead
 */
export function generatePersonalizedPrompt(context: GroupContext): string {
  // Keep for backwards compatibility during transition
  const parts: string[] = []
  parts.push(`## Group Context: use it for hyperpersonalization`)
  parts.push(`- Group: "${context.groupName}" (${context.guestCount} member${context.guestCount !== 1 ? 's' : ''})`)
  
  const memberNames = context.members.map(g => `${g.first_name} ${g.last_name}`).join(', ')
  parts.push(`- Members: ${memberNames}`)
  
  if (context.groupNotes) {
    parts.push(`- Notes: "${context.groupNotes}"`)
  }
  
  return parts.join('\n')
}

/**
 * Determine conversation tone based on group source - REMOVED FOR SIMPLIFICATION
 * This function has been removed per user feedback to simplify hyperpersonalization
 */
export function determineConversationTone(_context: GroupContext): string {
  return 'friendly'
}