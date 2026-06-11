# Detection Rules

This document describes how adalab shield detects and blocks short-form video content across supported platforms.

## Overview

adalab shield uses a multi-layered detection approach:

1. **URL-based detection** - Matches URL patterns for short-form video pages
2. **DOM-based detection** - Uses CSS selectors to identify short-form content elements
3. **Attribute-based detection** - Scans element attributes (e.g., href) for short-form patterns
4. **MutationObserver** - Monitors DOM changes to detect dynamically loaded content

## Supported Platforms

| Platform  | Content Type | Supported Domains                                 |
| --------- | ------------ | ------------------------------------------------- |
| YouTube   | Shorts       | `www.youtube.com`, `youtube.com`, `m.youtube.com` |
| TikTok    | Videos       | `www.tiktok.com`, `tiktok.com`                    |
| Instagram | Reels        | `www.instagram.com`, `instagram.com`              |

---

## YouTube Shorts

### URL Rules

| Pattern           | Action   | Priority | Description                   |
| ----------------- | -------- | -------- | ----------------------------- |
| `^/shorts/[\w-]+` | redirect | 100      | Individual Shorts video pages |

When a user visits `/shorts/VIDEO_ID`, adalab shield can redirect to the regular video player at `/watch?v=VIDEO_ID`.

### Selector Rules

| Selector                             | Action | Priority | Description                        |
| ------------------------------------ | ------ | -------- | ---------------------------------- |
| `ytd-reel-video-renderer`            | hide   | 90       | Individual Shorts in various feeds |
| `ytd-rich-item-renderer[is-shorts]`  | hide   | 90       | Shorts in rich grid layouts        |
| `ytd-rich-shelf-renderer[is-shorts]` | hide   | 85       | Shorts shelf sections              |
| `ytd-video-renderer[is-shorts]`      | hide   | 85       | Shorts in search results           |
| `ytd-grid-video-renderer[is-shorts]` | hide   | 85       | Shorts in grid layouts             |
| `[overlay-style="SHORTS"]`           | hide   | 80       | Shorts overlay indicators          |

### Attribute Rules

| Selector  | Attribute | Pattern     | Action | Priority |
| --------- | --------- | ----------- | ------ | -------- |
| `a[href]` | href      | `^/shorts/` | hide   | 70       |

### Detection Locations

- **Home page**: Shorts shelf sections and mixed feed items
- **Search results**: Shorts appearing in search
- **Channel pages**: Shorts tab and grid items
- **Subscriptions**: Shorts from subscribed channels
- **Sidebar recommendations**: Shorts suggestions

---

## TikTok

### URL Rules

| Pattern                | Action | Priority | Description            |
| ---------------------- | ------ | -------- | ---------------------- |
| `^/@[\w.-]+/video/\d+` | hide   | 100      | Individual video pages |
| `^/foryou`             | hide   | 95       | For You page           |

TikTok's entire feed is short-form content, so the extension blocks video pages and the For You feed.

### Selector Rules

| Selector                                     | Action | Priority | Description             |
| -------------------------------------------- | ------ | -------- | ----------------------- |
| `[data-e2e="recommend-list-item-container"]` | hide   | 90       | For You page items      |
| `[class*="DivItemContainer"]`                | hide   | 85       | Video containers        |
| `[data-e2e="search-card-container"]`         | hide   | 85       | Search result cards     |
| `[data-e2e="user-post-item"]`                | hide   | 85       | User profile videos     |
| `[data-e2e="following-item"]`                | hide   | 85       | Following feed items    |
| `[class*="DivVideoContainer"]`               | hide   | 80       | Video player containers |

### Page Blocking

When blocking TikTok, adalab shield:

1. Blurs the main content container
2. Displays a "adalab shield Active" overlay
3. Prevents autoplay of videos

---

## Instagram Reels

### URL Rules

| Pattern    | Action | Priority | Description           |
| ---------- | ------ | -------- | --------------------- |
| `^/reels/` | hide   | 100      | Reels tab/explore     |
| `^/reel/`  | hide   | 100      | Individual Reel pages |

### Selector Rules

| Selector             | Action | Priority | Parent  | Description           |
| -------------------- | ------ | -------- | ------- | --------------------- |
| `a[href*="/reels/"]` | hide   | 90       | article | Reels links in feed   |
| `a[href*="/reel/"]`  | hide   | 90       | article | Individual Reel links |
| `a[href^="/reels"]`  | hide   | 85       | -       | Reels navigation      |

### Detection Locations

- **Main feed**: Reels mixed into regular posts
- **Explore page**: Reels in the explore grid
- **Profile pages**: Reels tab on user profiles
- **Navigation**: Reels icon/link in sidebar

---

## Actions

adalab shield supports the following actions:

### Hide

Completely removes the element from view by setting:

```css
display: none !important;
visibility: hidden !important;
```

### Blur

Applies a blur effect to content:

```css
filter: blur(20px) !important;
pointer-events: none !important;
```

### Redirect

Redirects the user to an alternative URL (YouTube Shorts to regular video).

---

## Priority System

Rules are processed by priority (higher = processed first):

- **100**: URL-based blocking (highest priority)
- **90-95**: Primary selector rules
- **80-89**: Secondary selector rules
- **70-79**: Attribute-based rules (fallback)

---

## Whitelist Support

Users can whitelist:

1. **Channels/Users**: `@username` or channel ID format
2. **URLs**: Specific video URLs
3. **Patterns**: URL patterns (advanced)

Whitelisted content bypasses all detection rules.

---

## Performance Considerations

### MutationObserver Configuration

```javascript
{
  childList: true,
  subtree: true,
  attributes: false
}
```

### Debouncing

DOM scans are debounced (100ms) to prevent excessive processing during rapid DOM changes.

### Element Marking

Processed elements are marked with `data-adalab shield-hidden="true"` to prevent reprocessing.

---

## Adding New Rules

To add detection rules for a new platform or improve existing detection:

1. Edit `src/shared/constants/platforms.ts` for rule definitions
2. Create/update detector in `src/content/platforms/`
3. Add tests in `tests/unit/` and `tests/integration/`
4. Update this documentation

### Rule Structure

```typescript
interface Rule {
  type: 'url' | 'selector' | 'attribute';
  pattern?: string; // Regex pattern for URL/attribute rules
  selector?: string; // CSS selector
  attribute?: string; // Attribute name for attribute rules
  action: 'hide' | 'blur' | 'redirect';
  priority: number; // Higher = processed first
  parentSelector?: string; // Optional parent to target
}
```

---

## Troubleshooting

### Content Not Being Blocked

1. Check if the platform is enabled in settings
2. Verify the content isn't whitelisted
3. Check browser console for errors
4. Platform may have updated their DOM structure

### False Positives

If non-short content is being blocked:

1. Check whitelist settings
2. Report the issue with specific URL
3. Consider adding to whitelist temporarily

### Performance Issues

If pages are slow:

1. Reduce number of enabled platforms
2. Check for console errors
3. Try disabling/re-enabling the extension

---

## Security

- All selectors are validated at compile time
- No external API calls for detection
- No user data transmitted
- Detection runs entirely client-side

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing detection rules.
