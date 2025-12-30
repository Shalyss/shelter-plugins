---
layout: default
---
# Gemini Integration - Shelter Plugins

A collection of Shelter plugins integrating Google's Gemini AI into Discord clients.

## 📦 Available Plugins

### [Gemini Summarize](./plugins/gemini-summarize/)

A powerful Discord plugin that generates intelligent conversation summaries with context-aware display names and role colors.

**Installation URL:**
```
https://shalyss.github.io/shelter-plugins/gemini-summarize/plugin.js
```

**Features:**
- 📝 Smart synthesis-style conversation summaries
- 👥 Discord-native display
- 💚 Personal mention highlighting
- 📚 Summary history (last 5 per channel)
- 🌍 Multilingual support (8 languages)
- ⚡ Daily usage tracking and rate limiting

[➡️ Full documentation](./plugins/gemini-summarize/README.md)

---

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)

### Setup

```bash
# Clone the repository
git clone https://github.com/Shalyss/shelter-plugins.git
cd shelter-plugins

# Install dependencies
pnpm install

# Build all plugins
pnpm run build

# Development mode (watch mode)
pnpm run dev
```

### Project Structure

```
Gemini-Integration/
├── plugins/
│   └── gemini-summarize/      # Gemini Summarize plugin
│       ├── index.jsx           # Main plugin entry
│       ├── lib/                # Core functionality
│       ├── ui/                 # UI components
│       ├── plugin.json         # Plugin metadata
│       └── README.md           # Plugin documentation
├── package.json                # Root workspace config
└── pnpm-workspace.yaml         # pnpm workspace config
```

### Adding a New Plugin

1. Create a new folder in `plugins/`
2. Add a `package.json` with `build` and `dev` scripts:
   ```json
   {
     "name": "your-plugin-name",
     "scripts": {
       "build": "lune build",
       "dev": "lune dev"
     }
   }
   ```
3. Create your plugin files (index.jsx, plugin.json, etc.)
4. Run `pnpm run build` from the root to build all plugins

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
