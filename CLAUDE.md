# Wedding Website Development Guidelines

## Translation Requirements

**CRITICAL**: All user-facing text in this wedding website MUST be translated and use the translation system.

### Translation System Structure

- **Translation files**: `/translations/en.json` and `/translations/fr.json`
- **Translation hook**: Use `useTranslation()` hook in all components
- **Language context**: All pages wrapped with `LanguageProvider`
- **Language switcher**: Available in navigation (🇺🇸 EN / 🇫🇷 FR)

### Rules for Adding New Text

1. **Never hardcode text** - All text must use `t('key')` function
2. **Add translation keys** to both `en.json` and `fr.json` files
3. **Use descriptive keys** - Example: `t('home.program.ceremony')` not `t('text1')`
4. **Test both languages** - Always verify text appears correctly in EN and FR
5. **Keep consistency** - Use same structure in both translation files

### Example Usage

```tsx
// ❌ Wrong - hardcoded text
<h1>Welcome to our wedding</h1>

// ✅ Correct - using translation
const { t } = useTranslation()
<h1>{t('home.welcome')}</h1>
```

### Translation File Structure

```json
{
  "section": {
    "subsection": {
      "key": "Translated text here"
    }
  }
}
```

### Current Content Status

- ✅ All pages translated (Home, Transportation, Hotels, Wedding List)
- ✅ Navigation menu translated  
- ✅ All content uses lorem ipsum placeholders
- ✅ Language switcher functional

### When Adding New Features

1. Create translation keys in both language files FIRST
2. Use `useTranslation()` hook in component
3. Reference keys with `t('key.path')`
4. Test language switching works properly

**Remember**: This is a bilingual website. Every single piece of text that users see must be translatable!

## Feature Flags

### Program Display Feature Flag

**Environment Variable**: `SHOW_PROGRAM`
- **Type**: Boolean (string: 'true' or 'false')
- **Default**: 'false' (program hidden)
- **Location**: `.env.local` file

**Usage**:
```bash
# Show program details
SHOW_PROGRAM=true

# Hide program details (default)
SHOW_PROGRAM=false
```

**Behavior**:
- When `SHOW_PROGRAM=false`: Shows "Program details coming soon!" message
- When `SHOW_PROGRAM=true`: Shows full 4-day wedding program with all details

**Implementation**:
- Configured in `next.config.js` 
- Used in `pages/index.tsx` with conditional rendering
- Both states fully translated in `en.json` and `fr.json`

**To toggle the feature**:
1. Edit `.env.local` file
2. Change `SHOW_PROGRAM=true` or `SHOW_PROGRAM=false`
3. Restart development server (`npm run dev`)

This allows easy control of program visibility without code changes.