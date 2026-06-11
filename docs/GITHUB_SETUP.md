# GitHub Repository Setup Guide

This guide explains how to configure the adalab shield GitHub repository for maximum visibility and stars.

## Repository Topics

Add these topics to help users discover adalab shield:

**To add topics:**

1. Go to repository homepage on GitHub
2. Click the gear icon next to "About"
3. Add the following topics:

```
browser-extension
productivity
focus
youtube-shorts
tiktok
instagram-reels
content-blocker
distraction-blocker
pomodoro
time-tracking
habit-tracking
chrome-extension
firefox-addon
edge-extension
productivity-tools
focus-mode
self-improvement
digital-wellbeing
screen-time
productivity-app
```

## Repository Description

Update the repository description (appears under the repo name):

```
Block short-form videos and reclaim your focus. Comprehensive productivity toolkit with Focus Mode, Pomodoro Timer, Time Limits, Streak Tracking, and more. Available for Chrome, Firefox & Edge.
```

## Social Preview Image

**Recommended size:** 1280x640px (2:1 aspect ratio)

**To add:**

1. Go to Settings > General
2. Scroll to "Social preview"
3. Upload an image that includes:
   - adalab shield logo
   - Tagline: "Block short-form videos. Reclaim your focus."
   - Key features icons (YouTube, TikTok, Instagram)
   - Visual showing before/after

**Design tips:**

- Use brand colors
- Keep text large and readable
- Show the problem/solution visually
- Include browser logos (Chrome, Firefox, Edge)

## Repository Settings

### General Settings

- **Features**
  - ✅ Issues (for bug reports and feature requests)
  - ✅ Discussions (for community Q&A)
  - ✅ Projects (for roadmap tracking)
  - ✅ Wiki (optional - for extended documentation)
  - ✅ Sponsorships (if you want to enable GitHub Sponsors)

### Security

- ✅ Enable Dependabot alerts
- ✅ Enable Dependabot security updates
- ✅ Enable CodeQL analysis (already configured via .github/workflows/codeql.yml)

### Branches

- **Default branch:** `main`
- **Branch protection rules for `main`:**
  - ✅ Require pull request reviews before merging
  - ✅ Require status checks to pass (CI, CodeQL)
  - ✅ Require branches to be up to date before merging
  - ❌ Do not allow force pushes
  - ❌ Do not allow deletions

## GitHub Discussions

Enable Discussions for:

- General questions
- Feature ideas brainstorming
- Show and tell (user success stories)
- Community support

**Categories to create:**

1. 📣 Announcements (for releases, updates)
2. 💡 Ideas (feature requests)
3. 🙏 Q&A (questions from users)
4. 📝 Show and tell (user success stories)
5. 🐛 Bug reports (link to Issues)

## GitHub Projects

Create a public project board for transparency:

**Columns:**

1. 📋 Backlog
2. 🔍 Under Consideration
3. ✅ Approved
4. 🚧 In Progress
5. ✅ Done

**Link to Roadmap:**

- Add milestones from README roadmap
- Make it public so users can see what's coming
- Link issues to project cards

## Release Strategy

### Version Tags

Use semantic versioning (already configured):

- `v0.1.0` - Initial release
- `v0.2.0` - Minor feature updates
- `v1.0.0` - Stable release
- `v1.1.0` - New features
- `v1.0.1` - Bug fixes

### Release Notes

For each release, include:

1. **What's New** - New features
2. **Improvements** - Enhancements to existing features
3. **Bug Fixes** - What was fixed
4. **Breaking Changes** - If any
5. **Downloads** - Direct download links
6. **Installation** - Quick install guide
7. **Contributors** - Thank contributors

### Release Checklist

Before creating a release:

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run full test suite (`pnpm test:unit`)
- [ ] Build for all browsers (`pnpm build:all`)
- [ ] Test extension in each browser
- [ ] Create git tag: `git tag v0.1.0`
- [ ] Push tag: `git push origin v0.1.0`
- [ ] GitHub Actions will automatically create release draft
- [ ] Add release notes
- [ ] Publish release

## GitHub Actions Badges

Already added to README:

- ✅ CI status
- ✅ CodeQL status
- ✅ Code coverage (Codecov)
- ✅ License badge
- ✅ GitHub stars

**Additional badges to consider:**

- Version badge from GitHub releases
- Browser support badges
- Downloads count (once published to stores)

## SEO & Discoverability

### README Optimization

- ✅ Clear, compelling title
- ✅ Problem statement upfront
- ✅ Visual demo (GIF/video)
- ✅ Feature comparison table
- ✅ Quick start guide
- ✅ Badges for credibility
- ✅ Links to documentation
- ✅ Clear call-to-action (Install, Star)

### Keywords in Files

Ensure these files contain relevant keywords:

- ✅ README.md - Primary keywords
- ✅ package.json - Description, keywords
- ✅ FEATURES.md - Detailed feature descriptions
- ✅ CHANGELOG.md - Feature release history

### External Links

**Link from:**

- Chrome Web Store listing → GitHub repo
- Firefox Add-ons listing → GitHub repo
- Edge Add-ons listing → GitHub repo
- Personal website/blog → GitHub repo
- Social media profiles → GitHub repo

## Community Building

### First Contributor Welcome

Add `.github/workflows/first-contribution.yml`:

```yaml
name: Welcome

on:
  pull_request_target:
    types: [opened]
  issues:
    types: [opened]

jobs:
  welcome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/first-interaction@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          issue-message: 'Thanks for opening your first issue! We appreciate your contribution.'
          pr-message: 'Thanks for opening your first PR! We'll review it soon.'
```

### Good First Issues

Regularly tag easy issues with `good first issue` label to attract new contributors.

### Respond Quickly

- Aim to respond to issues within 24-48 hours
- Thank contributors for PRs
- Be encouraging and welcoming

## Promoting the Repository

### Where to Share

1. **Reddit**
   - r/productivity
   - r/chrome_extensions
   - r/firefox
   - r/opensource
   - r/digitalnomad

2. **Hacker News**
   - Show HN: adalab shield - Block short-form videos

3. **Product Hunt**
   - Launch as a new product
   - Gather feedback and reviews

4. **Dev.to / Hashnode**
   - Write blog post about why you built it
   - Technical deep dive on architecture
   - Lessons learned

5. **Twitter/X**
   - Tweet about releases
   - Share user testimonials
   - Show metrics (blocks prevented, time saved)

6. **LinkedIn**
   - Professional angle: productivity at work
   - Share success stories

### Content Ideas

1. **Technical Blog Posts**
   - "How I built a Chrome extension with React and TypeScript"
   - "Blocking short-form videos: The technical challenges"
   - "Building a privacy-first browser extension"

2. **User Stories**
   - Collect testimonials
   - Share success metrics
   - Before/after comparisons

3. **Video Content**
   - Demo video for YouTube
   - Installation tutorial
   - Feature walkthroughs

## Analytics (Privacy-Preserving)

**Do NOT add:**

- ❌ Google Analytics
- ❌ Any tracking pixels
- ❌ External analytics services

**Optional (privacy-preserving):**

- GitHub Insights (built-in, anonymous)
- Star history tracking (public info)
- Download counts from stores

## Milestones

Set public milestones to show progress:

- 🎯 100 stars
- 🎯 500 stars
- 🎯 1,000 stars
- 🎯 5,000 stars
- 🎯 10,000 stars

Celebrate each milestone with:

- Thank you message
- Special release
- Recognition of top contributors

---

## Quick Checklist

Use this checklist to ensure everything is configured:

- [ ] Repository description set
- [ ] Topics added (at least 10)
- [ ] Social preview image uploaded
- [ ] Discussions enabled
- [ ] Projects board created and public
- [ ] Branch protection enabled
- [ ] Dependabot configured
- [ ] All README badges working
- [ ] LICENSE file present
- [ ] CONTRIBUTING.md clear
- [ ] SECURITY.md present
- [ ] CHANGELOG.md updated
- [ ] Issue templates configured
- [ ] PR templates configured
- [ ] Release workflow working

---

**Remember:** Stars come from providing genuine value. Focus on:

1. Solving a real problem
2. Great documentation
3. Active maintenance
4. Community engagement
5. Quality over hype
