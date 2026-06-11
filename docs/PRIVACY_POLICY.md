# Privacy Policy

**Last updated: December 2024**

## Overview

adalab shield is designed with privacy as a core principle. We believe in transparency and giving users complete control over their data.

## Data Collection

### What We DON'T Collect

- **No personal information**: We don't collect names, emails, or any identifying information
- **No browsing history**: We don't track or store the websites you visit
- **No analytics**: We don't use Google Analytics, Mixpanel, or any tracking services
- **No external requests**: adalab shield makes no network requests to external servers
- **No telemetry**: We don't collect usage statistics or crash reports

### What We Store Locally

adalab shield stores the following data **only on your device** using the browser's local storage:

| Data         | Purpose                                    | Storage                |
| ------------ | ------------------------------------------ | ---------------------- |
| Settings     | Your preferences (enabled platforms, etc.) | `chrome.storage.local` |
| Whitelist    | Channels/URLs you've chosen to allow       | `chrome.storage.local` |
| Statistics   | Count of blocked items                     | `chrome.storage.local` |
| Activity Log | Recent blocking events                     | `chrome.storage.local` |

## Data Usage

All stored data is used solely to:

1. Apply your blocking preferences
2. Display statistics in the popup
3. Show activity in the log viewer
4. Restore settings across browser sessions

## Data Sharing

**We do not share any data with anyone.** Period.

- No data is sent to our servers (we don't have any)
- No data is shared with third parties
- No data is used for advertising
- No data is sold

## Data Retention

- All data is stored locally on your device
- Data persists until you uninstall the extension or clear your browser data
- You can clear all adalab shield data at any time via the Options page

## Permissions Explained

adalab shield requires certain browser permissions to function:

| Permission         | Why It's Needed                        |
| ------------------ | -------------------------------------- |
| `storage`          | Save your settings locally             |
| `tabs`             | Detect which website you're visiting   |
| `Host permissions` | Run content scripts on target websites |

## Open Source

adalab shield is fully open source. You can:

- Review our code at [GitHub](https://github.com/adalab/adalab shield)
- Verify our privacy claims by examining the source
- Report any concerns via GitHub Issues

## Your Rights

You have complete control over your data:

- **Access**: View all stored data in Options → Export
- **Delete**: Clear all data in Options → Clear Data
- **Portability**: Export your settings as JSON

## Changes to This Policy

If we make changes to this privacy policy, we will:

1. Update the "Last updated" date
2. Note significant changes in the CHANGELOG
3. For major changes, notify users via the extension update notes

## Contact

For privacy concerns or questions:

- Open a [GitHub Issue](https://github.com/adalab/adalab shield/issues)
- Label your issue with "privacy"

## Summary

**TL;DR**: adalab shield doesn't collect, store, or share any of your personal data. Everything stays on your device, and you're in complete control.
