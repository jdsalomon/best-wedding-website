import fs from 'fs'
import path from 'path'

// Load prompts immediately when module is imported (at server startup)
function loadSystemPromptAtStartup(): string {
  const promptsDir = path.join(process.cwd(), 'prompts')
  
  // Define the order of prompt files to load
  const promptFiles = [
    '1-system.md',
    '2-wedding-details.md',
    '3-program.md', 
    '4-transportation.md',
    '5-accommodations.md',
    '6-misc.md'
  ]

  let combinedPrompt = ''

  // Load each markdown file and combine
  for (const filename of promptFiles) {
    const filePath = path.join(promptsDir, filename)
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      combinedPrompt += content + '\n\n'
    } catch (error) {
      console.error(`Error loading prompt file ${filename}:`, error)
      // Continue with other files if one fails
    }
  }

  return combinedPrompt.trim()
}

// Export the pre-loaded system prompt
export const SYSTEM_PROMPT = loadSystemPromptAtStartup()

/**
 * Load the hyperpersonalization template (used only when user is authenticated)
 */
export function loadHyperpersonalizationTemplate(): string {
  const promptsDir = path.join(process.cwd(), 'prompts')
  const filePath = path.join(promptsDir, '7-hyperpersonalization.md')
  
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error('Error loading hyperpersonalization template:', error)
    return ''
  }
}