# Ashok Srirama's Personal Website 🚀

Welcome to the source code of my personal website! This is where I share my adventures with AWS containers, Kubernetes, and all things cloud native.

## 🎯 What's This About?

This site is built with [Docusaurus 2](https://docusaurus.io/) and serves as:
- 📝 A blog for my AWS technical posts
- 📚 A collection of tutorials and guides
- 🎓 A learning resource for the community

## 🛠️ Tech Stack

- **Framework**: Docusaurus 2
- **Hosting**: GitHub Pages (probably)
- **Search**: Lunr Search
- **Extras**: Image zoom, syntax highlighting, and dark mode (because we're not savages)

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Local Development

```bash
npm start
```

This fires up a local dev server and opens your browser. Most changes are hot-reloaded, so you can see your mistakes in real-time!

### Build

```bash
npm run build
```

Generates static content into the `build` directory. Ready to be served by any static hosting service.

### Deployment

Using SSH:

```bash
USE_SSH=true npm run deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

If you're using GitHub Pages, this command builds the site and pushes to the `gh-pages` branch.

## 📁 Project Structure

```
.
├── blog/                  # Blog posts organized by year
├── docs/                  # Tutorial documentation
├── src/
│   ├── components/       # React components
│   ├── css/             # Custom styles
│   └── pages/           # Custom pages (About, etc.)
├── static/              # Static assets (images, files)
└── docusaurus.config.js # Site configuration
```

## 🤝 Contributing

Found a typo? Have a suggestion? Feel free to open an issue or PR!

## 📬 Contact

- **Twitter**: [@ashoksrirama](https://twitter.com/ashoksrirama)
- **LinkedIn**: [ashok-srirama](https://www.linkedin.com/in/ashok-srirama/)
- **GitHub**: [ashoksrirama](https://github.com/ashoksrirama)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ☕ and a healthy dose of curiosity.
