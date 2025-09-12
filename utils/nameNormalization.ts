/**
 * Normalizes a name for flexible matching by:
 * - Removing accents/diacritics (José → Jose)  
 * - Removing all spaces (Sarah De Paz → SarahDePaz)
 * - Converting to lowercase (SaraH → sarah)
 * - Trimming whitespace
 * 
 * This enables matching names regardless of accent, case, or spacing differences.
 */
export function normalizeNameForMatching(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }

  return name
    .trim() // Remove leading/trailing whitespace
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/\s+/g, '') // Remove all spaces
    .toLowerCase() // Convert to lowercase
}

/**
 * Compares two names using flexible matching rules.
 * Returns true if names match when normalized.
 */
export function namesMatch(name1: string, name2: string): boolean {
  return normalizeNameForMatching(name1) === normalizeNameForMatching(name2)
}

/**
 * Finds a guest in an array by matching first and last names flexibly.
 * Useful for finding users after login regardless of input variations.
 */
export function findGuestByName<T extends { first_name: string; last_name: string }>(
  guests: T[],
  firstName: string,
  lastName: string
): T | undefined {
  return guests.find(guest => 
    namesMatch(guest.first_name, firstName) &&
    namesMatch(guest.last_name, lastName)
  )
}