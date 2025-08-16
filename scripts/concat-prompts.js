#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const promptsDir = path.join(__dirname, '..', 'prompts');
const promptFiles = [
  '1-system.md',
  '2-wedding-details.md', 
  '3-program.md',
  '4-transportation.md',
  '5-accommodations.md',
  '6-misc.md'
];

let concatenatedPrompts = '';

promptFiles.forEach(file => {
  const filePath = path.join(promptsDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    concatenatedPrompts += `# ${file}\n\n${content}\n\n---\n\n`;
  }
});

// Copy to clipboard (macOS)
try {
  execSync('pbcopy', { input: concatenatedPrompts });
  console.log('✅ All prompts concatenated and copied to clipboard!');
  console.log(`📝 Total length: ${concatenatedPrompts.length} characters`);
} catch (error) {
  console.error('❌ Failed to copy to clipboard:', error.message);
  console.log('📄 Content:');
  console.log(concatenatedPrompts);
}