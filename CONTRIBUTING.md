# Contributing to Gemini Integration

Thank you for your interest in contributing to Gemini Integration! This document provides guidelines and information for contributors.

## 🌍 Internationalization (i18n)

### Adding a New Language

1. Open `plugins/gemini-shelter/lib/i18n.js`
2. Add a new language object following the pattern of existing languages
3. All translation keys must match the structure in `en-US`
4. Test with Discord's language setting changed to your new language

### Translation Keys Structure

```javascript
{
    // Menu & Headers
    "gemini.menu.title": "...",
    "gemini.button.unread": "...",
    "gemini.button.lastX": "...",
    
    // Modals
    "gemini.modal.unread.title": "...",
    // ... etc
}
```

### Prompt Localization

The Gemini prompts are localized based on Discord's language:
- English: Used for all `en-*` locales
- French: Used for `fr` locale
- Other languages: Default to English prompts (contributions welcome!)

Location: `plugins/gemini-shelter/lib/summary.js` - search for `isEnglish` check

## 🎨 UI Guidelines

### CSS Variables

Always prefer Discord's CSS variables:
- `var(--background-primary)`, `var(--background-secondary)`
- `var(--text-normal)`, `var(--text-muted)`
- `var(--spacing-8)`, `var(--spacing-12)`, `var(--spacing-16)`

For non-existent variables, use pixel fallbacks.

### Modal Design

- Use Shelter's built-in modal components (`ModalRoot`, `ModalHeader`, `ModalBody`, `ModalFooter`)
- Maintain consistent spacing (12-24px margins between sections)
- Always provide close buttons and keyboard shortcuts

### Toast Notifications

- Position: `bottom: 80px` (above text input), centered horizontally
- Duration: 3-5 seconds for success, 7-10 seconds for errors
- Always include context in error messages

## 🔧 Code Style

### File Organization

```
plugins/gemini-shelter/
├── index.jsx           # Main UI, modals, rendering
├── lib/
│   ├── api.js         # Gemini API calls, rate limiting
│   ├── summary.js     # Message formatting, summarization
│   ├── i18n.js        # Translations
│   └── autoReply.js   # Auto-reply feature (experimental)
└── ui/
    └── Settings.jsx   # Settings panel
```

### Naming Conventions

- Functions: `camelCase` (e.g., `getUserRoleColor`)
- Components: `PascalCase` (e.g., `GeminiIcon`)
- CSS classes: `kebab-case` (e.g., `gemini-modal-content`)
- Translation keys: `dot.notation` (e.g., `gemini.toast.copied`)

### Comments

- Use JSDoc for functions with complex parameters
- Explain "why" not "what" in inline comments
- Keep comments up-to-date with code changes

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR:

- [ ] Test with multiple Discord languages (at least EN and FR)
- [ ] Test role color rendering with various role configurations
- [ ] Test @mention detection with special characters and accents
- [ ] Verify toast positioning on different screen sizes
- [ ] Check summary history persistence across plugin reloads
- [ ] Test rate limiting behavior
- [ ] Ensure no console errors in browser dev tools

### Rate Limit Testing

- Local: Max 5 requests per minute
- Remote: Test with invalid API key to verify error handling
- Daily: Verify daily quota tracking (20 requests/day)

## 🐛 Bug Reports

When reporting bugs, include:

1. **Environment**: Legcord version, OS, Discord language setting
2. **Steps to Reproduce**: Clear, numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Console Logs**: Any errors from browser dev tools (F12)
6. **Screenshots**: If UI-related

## 💡 Feature Requests

For feature requests, explain:

1. **Use Case**: Why is this feature needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other solutions you've considered
4. **Impact**: Who benefits from this feature?

## 📦 Pull Request Process

1. **Fork** the repository
2. **Create a branch** with a descriptive name (`feature/add-spanish-translation`, `fix/toast-positioning`)
3. **Make your changes** following the code style guidelines
4. **Test thoroughly** using the manual testing checklist
5. **Commit** with clear, descriptive messages
6. **Push** to your fork
7. **Open a PR** with:
   - Clear title and description
   - Reference any related issues
   - Screenshots/videos for UI changes
   - List of tested scenarios

## 🔍 Code Review

Expect reviewers to check:

- Code quality and maintainability
- Performance implications
- Security considerations (especially API key handling)
- i18n completeness (all languages updated)
- Discord ToS compliance
- User experience impact

## 📚 Resources

- [Shelter Documentation](https://github.com/uwu/shelter)
- [Legcord](https://github.com/legcord/legcord)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Discord Developer Portal](https://discord.com/developers/docs)

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, is valuable. Thank you for helping improve Gemini Integration!
