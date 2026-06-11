# adalab shield Architecture

This document describes the technical architecture of adalab shield.

## Overview

adalab shield is a browser extension built with:

- **Manifest V3** (Chrome) / **Manifest V2** (Firefox)
- **TypeScript** for type safety
- **React** for UI components
- **Vite** for building

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    Messages    ┌────────────────────────┐ │
│  │  Service Worker  │◄──────────────►│    Content Scripts     │ │
│  │  (Background)    │                │                        │ │
│  │                  │                │  ┌─────────────────┐   │ │
│  │  - Settings      │                │  │ Platform        │   │ │
│  │  - Stats         │                │  │ Detectors       │   │ │
│  │  - Logging       │                │  │ - YouTube       │   │ │
│  │  - Whitelist     │                │  │ - TikTok        │   │ │
│  └────────┬─────────┘                │  │ - Instagram     │   │ │
│           │                          │  └─────────────────┘   │ │
│           │ Storage                  │                        │ │
│           ▼                          │  ┌─────────────────┐   │ │
│  ┌──────────────────┐                │  │ Actions         │   │ │
│  │ chrome.storage   │                │  │ - Hide          │   │ │
│  │ - local          │                │  │ - Blur          │   │ │
│  │ - session        │                │  │ - Redirect      │   │ │
│  └──────────────────┘                │  └─────────────────┘   │ │
│                                      └────────────────────────┘ │
│                                                                  │
│  ┌──────────────────┐    ┌────────────────────────────────────┐ │
│  │   Popup UI       │    │         Options Page               │ │
│  │                  │    │                                    │ │
│  │  - Toggle        │    │  - Whitelist management            │ │
│  │  - Platform      │    │  - Custom rules                    │ │
│  │    switches      │    │  - Log viewer                      │ │
│  │  - Stats         │    │  - Import/Export                   │ │
│  └──────────────────┘    └────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Service Worker (Background)

Located in `src/background/`

**Responsibilities:**

- Manage extension state and settings
- Handle cross-component communication
- Track blocking statistics
- Manage whitelist
- Store and retrieve logs

**Key Files:**

- `index.ts` - Entry point, message handlers
- `storage.ts` - Storage layer abstraction

### Content Scripts

Located in `src/content/`

**Responsibilities:**

- Detect short-form video elements
- Apply blocking actions
- Monitor DOM changes
- Communicate with Service Worker

**Key Files:**

- `index.ts` - Entry point, orchestrator
- `platforms/` - Platform-specific detectors
  - `youtube.ts` - YouTube Shorts detection
  - `tiktok.ts` - TikTok detection
  - `instagram.ts` - Instagram Reels detection
- `actions/` - Blocking actions
  - `hide.ts` - Element hiding/blurring
  - `redirect.ts` - URL redirection

### Popup UI

Located in `src/popup/`

**Responsibilities:**

- Quick toggle for blocking
- Per-platform toggles
- Display blocking statistics
- Link to options page

**Key Files:**

- `index.tsx` - React entry point
- `Popup.tsx` - Main popup component

### Options Page

Located in `src/options/`

**Responsibilities:**

- Detailed settings management
- Whitelist management
- Custom CSS rules
- Log viewing
- Import/Export settings

**Key Files:**

- `index.tsx` - React entry point
- `Options.tsx` - Main options component
- `components/` - Reusable components
  - `Whitelist.tsx`
  - `CustomRules.tsx`
  - `LogViewer.tsx`
  - `ExportImport.tsx`

### Shared Utilities

Located in `src/shared/`

**Responsibilities:**

- Type definitions
- Constants
- Utility functions
- React hooks

**Key Files:**

- `types/` - TypeScript types
- `constants/` - App constants
- `utils/` - Utility functions
  - `i18n.ts` - Internationalization
  - `validation.ts` - Input validation
  - `messaging.ts` - Cross-component messaging
- `hooks/` - React hooks
  - `useI18n.ts` - i18n hook
  - `useSettings.ts` - Settings hook

## Data Flow

### Blocking Flow

```
1. User visits YouTube/TikTok/Instagram
2. Content script loads and initializes
3. Platform detector identifies short-form content
4. Content script checks whitelist via Service Worker
5. If not whitelisted, apply blocking action
6. Increment block count via Service Worker
7. Add entry to activity log
```

### Settings Update Flow

```
1. User changes setting in Popup/Options
2. Setting is saved to chrome.storage.local
3. Storage change event fires
4. All components receive update
5. Content scripts apply new settings
```

## Security Considerations

### Content Security Policy

- No inline scripts
- No eval()
- Strict CSP in manifest

### Input Validation

- All user inputs sanitized
- CSS selectors validated before use
- URLs validated before processing

### Message Passing

- Sender validation on all messages
- Only accept messages from known sources
- No external communication

## Performance

### Content Script Optimization

- MutationObserver for efficient DOM monitoring
- Debounced processing of changes
- Minimal DOM queries

### Memory Management

- Proper cleanup of observers
- Limited log retention (configurable)
- Efficient data structures

## Browser Compatibility

### Chrome (Manifest V3)

- Service Worker for background
- `action` API for popup
- Separate `host_permissions`

### Firefox (Manifest V2)

- Event page for background
- `browser_action` API
- Combined permissions
- WebExtension polyfill for API compatibility

## Testing Strategy

### Unit Tests

- Pure functions in utils
- Platform detectors
- Validation logic

### Integration Tests

- Component interactions
- Storage operations
- Message passing

### E2E Tests

- Full blocking flow
- UI interactions
- Cross-browser testing
