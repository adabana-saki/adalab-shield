# Contributing to adalab shield

First off, **thank you** for considering contributing to adalab shield! Every contribution helps make the web a less distracting place.

[日本語](CONTRIBUTING.ja.md)

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Your First Contribution](#making-your-first-contribution)
- [Code Guidelines](#code-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Ways to Contribute

There are many ways to contribute, even if you don't write code:

| Contribution Type    | Description                                   | Difficulty  |
| -------------------- | --------------------------------------------- | ----------- |
| **Report Bugs**      | Found something broken? Let us know!          | Easy        |
| **Suggest Features** | Have an idea? We'd love to hear it            | Easy        |
| **Improve Docs**     | Fix typos, add examples, clarify instructions | Easy        |
| **Translate**        | Help make adalab shield accessible globally   | Easy-Medium |
| **Fix Bugs**         | Squash those pesky bugs                       | Medium      |
| **Add Features**     | Implement new functionality                   | Medium-Hard |
| **Review PRs**       | Help review other contributions               | Medium      |

---

## Getting Started

### Find Something to Work On

1. **Good First Issues**: Start here! Issues labeled [`good first issue`](https://github.com/adabana-saki/adalab-shield/labels/good%20first%20issue) are specifically designed for new contributors.

2. **Help Wanted**: Issues labeled [`help wanted`](https://github.com/adabana-saki/adalab-shield/labels/help%20wanted) are ready for anyone to pick up.

3. **Your Own Ideas**: Have something in mind? Open an issue first to discuss!

### Before You Start

1. **Check existing issues** to avoid duplicates
2. **Comment on the issue** you want to work on (we'll assign it to you)
3. **Ask questions** if anything is unclear — we're happy to help!

---

## Development Setup

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** 9 or higher
- A modern browser (Chrome, Firefox, or Edge)

### Quick Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/adalab shield.git
cd adalab shield

# 3. Install dependencies
pnpm install

# 4. Start development server
pnpm dev

# 5. Load the extension in your browser
# Chrome: chrome://extensions → Developer mode → Load unpacked → dist/chrome
# Firefox: about:debugging → Load Temporary Add-on → dist/firefox/manifest.json
```

### Useful Commands

```bash
pnpm dev            # Start dev server with hot reload
pnpm build:chrome   # Build for Chrome
pnpm build:firefox  # Build for Firefox
pnpm build:edge     # Build for Edge
pnpm build:all      # Build for all browsers
pnpm test:unit      # Run unit tests
pnpm test:e2e       # Run E2E tests
pnpm lint           # Check code style
pnpm lint:fix       # Auto-fix code style issues
pnpm typecheck      # Check TypeScript types
pnpm i18n:check     # Validate translations
```

---

## Making Your First Contribution

### Step-by-Step Guide

1. **Fork & Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/adalab shield.git
   cd adalab shield
   ```

2. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make Your Changes**
   - Write your code
   - Add tests if applicable
   - Update documentation if needed

4. **Test Your Changes**

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test:unit
   ```

5. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub!

---

## Code Guidelines

### TypeScript

- Use TypeScript strict mode (already configured)
- Avoid `any` type — use proper types
- Export types that are used across files

### React

- Use functional components with hooks
- Keep components small and focused
- Use the existing UI component patterns

### Styling

- Use Tailwind CSS classes
- Follow existing naming conventions
- Keep styles scoped to components

### File Structure

```text
src/
├── background/      # Service worker logic
├── content/         # Content scripts (DOM manipulation)
├── popup/           # Popup UI components
├── options/         # Options page components
└── shared/          # Shared utilities, types, hooks
```

### Testing

- Write tests for new features
- Maintain existing test coverage
- Test files go in `tests/` with `.test.ts` extension

---

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/). This helps us:

- Generate changelogs automatically
- Trigger semantic versioning
- Keep history readable

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type       | Description                               |
| ---------- | ----------------------------------------- |
| `feat`     | New feature                               |
| `fix`      | Bug fix                                   |
| `docs`     | Documentation only                        |
| `style`    | Code style (formatting, semicolons, etc.) |
| `refactor` | Code refactoring (no feature/fix)         |
| `test`     | Adding or updating tests                  |
| `chore`    | Maintenance tasks                         |
| `perf`     | Performance improvement                   |

### Examples

```bash
feat(content): add TikTok live stream blocking
fix(popup): resolve toggle not persisting state
docs(readme): add troubleshooting section
style(options): fix button alignment
test(content): add tests for YouTube detector
```

---

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test:unit`)
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with `main`

### PR Template

When you open a PR, you'll see a template. Please fill it out completely:

- Describe what you changed and why
- Link related issues
- Add screenshots for UI changes
- Mark the appropriate checkboxes

### Review Process

1. **Automated checks** run first (CI, linting, tests)
2. **Maintainer review** within a few days
3. **Address feedback** if requested
4. **Merge!** Once approved, we'll merge your PR

### After Merge

- Your contribution is live!
- You'll be added to our contributors list
- The change will be included in the next release

---

## Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Discord**: Coming soon!

### Code of Conduct

We expect all contributors to be respectful and constructive. See our Code of Conduct for details.

### Recognition

All contributors are recognized! Your GitHub avatar will appear in our README and release notes.

---

## Thank You!

Every contribution matters. Whether you're fixing a typo, adding a translation, or implementing a new feature — you're helping make adalab shield better for everyone.

**Questions?** Open an issue or start a discussion. We're here to help!

---

<div align="center">

**Happy Contributing!**

</div>
