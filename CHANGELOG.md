# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added

- **Smart Conversation Summaries**: Synthesis-style summaries with specific subject names instead of generic categories
- **Discord-Native Display Names**: Real nicknames with role colors in @mentions
- **Personal Mention Highlighting**: Green color (#43b581) for current user mentions
- **Summary History**: Store last 5 summaries per channel without API consumption
- **Multilingual Support**: Full i18n in 8 languages (EN, FR, DE, ES, PT, IT, JA, RU)
- **Rate Limiting**: Local (5 req/min) and daily quota tracking (20 req/day)
- **Beautiful UI**: Discord-themed modals, toasts, and buttons
- **Prompt Engineering**: Gemini prompts optimized for synthesis over listing
- **Embed Content Extraction**: Includes titles, descriptions, and URLs from embeds
- **Localized Date Formatting**: History dates formatted per Discord locale

### Documentation

- Comprehensive README with features, installation, and troubleshooting
- CONTRIBUTING.md with i18n, UI, and code guidelines
- MIT License
- Enhanced .gitignore for build outputs and temporary files
