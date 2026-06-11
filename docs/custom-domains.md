# Custom Domain Blocking - Beginner's Guide

## 📚 Table of Contents

1. [What are Custom Domains?](#what-are-custom-domains)
2. [How to Set Up](#how-to-set-up)
3. [Pattern Syntax](#pattern-syntax)
4. [Examples](#examples)
5. [FAQ](#faq)

---

## What are Custom Domains?

The Custom Domain feature allows you to block **entire websites** beyond the built-in platforms (YouTube, TikTok, Instagram, etc.).

### Use Cases

- Block news sites during work hours
- Block all social media platforms
- Restrict access to gaming sites
- Block specific subdomains only

---

## How to Set Up

### Step 1: Open Settings

1. Click the adalab shield icon in your browser toolbar
2. Select "Settings" or "Options"

### Step 2: Navigate to Custom Domains

1. Click the "Custom Domains" tab in settings
2. Click the "Add New Domain" button

### Step 3: Add a Domain

1. Enter a **domain pattern** (e.g., `twitter.com`)
2. Enter a **description** (optional - helps you identify it)
3. Click the "Add" button

### Step 4: Verify

Visit the added domain and you should see the block screen.

---

## Pattern Syntax

adalab shield supports multiple pattern formats.

### 1. **Exact Match** (Recommended)

```
twitter.com
```

**Matches:**

- `https://twitter.com`
- `https://www.twitter.com`
- `https://mobile.twitter.com` (includes subdomains)

**Does NOT match:**

- `https://mytwitter.com`

---

### 2. **Wildcard: Contains**

```
*youtube*
```

**Matches:**

- `https://youtube.com`
- `https://m.youtube.com`
- `https://myyoutube.com`
- `https://youtube-dl.org`

**Use case:**
Block all YouTube-related sites

---

### 3. **Wildcard: Starts With**

```
reddit*
```

**Matches:**

- `https://reddit.com`
- `https://reddit-stream.com`
- `https://reddit.example.com`

**Does NOT match:**

- `https://myreddit.com`

---

### 4. **Wildcard: Ends With**

```
*reddit
```

**Matches:**

- `https://reddit`
- `https://myreddit`
- `https://old.reddit`

**Does NOT match:**

- `https://reddit.com`

---

### 5. **Subdomain Match**

```
*.youtube.com
```

**Matches:**

- `https://m.youtube.com`
- `https://music.youtube.com`
- `https://studio.youtube.com`

**Does NOT match:**

- `https://youtube.com` (main domain excluded)

---

## Examples

### Example 1: Block All Social Media

```
twitter.com
facebook.com
instagram.com
tiktok.com
linkedin.com
```

### Example 2: Block News Sites

```
cnn.com
bbc.com
nytimes.com
theguardian.com
```

### Example 3: Block Entertainment

```
*netflix*
*hulu*
*disney*
*amazon*video*
```

### Example 4: Block Gaming Sites

```
*.steampowered.com
*.epicgames.com
twitch.tv
```

### Example 5: Block Reddit Variants

```
*.reddit.com
old.reddit.com
new.reddit.com
```

---

## FAQ

### Q1: Why isn't blocking working?

**Check these:**

1. **Is the extension enabled?**
   - Click the adalab shield icon
   - Verify "adalab shield Enabled" is ON

2. **Is the pattern correct?**
   - Use domain name only (no `https://` or `/`)
   - Example: ❌ `https://twitter.com/` → ✅ `twitter.com`

3. **Try clearing cache**
   - Clear browser cache and cookies
   - Reload the page

### Q2: Can I use patterns like `*youtube/*`?

Yes! Both work:

- `*youtube*` - matches all domains containing "youtube"
- `*youtube/*` - same (slashes are ignored)

**Recommended:** Use `*youtube*` for simplicity.

### Q3: Can I temporarily disable blocking?

**Method 1: Remove specific domain**

1. Settings → Custom Domains
2. Click "Delete" next to the domain

**Method 2: Disable extension**

1. Click adalab shield icon
2. Toggle OFF

### Q4: How many domains can I add?

**Current limit:** 100 custom domains

### Q5: Can I use regular expressions?

No, currently only **wildcards (`*`)** are supported.

---

## Troubleshooting

### Issue: Settings not taking effect

**Solutions:**

1. **Refresh the page**
2. **Restart your browser**
3. **Reinstall the extension**

### Issue: Want to block only specific subdomain

Example: Block `m.youtube.com` but allow `youtube.com`

**Current limitation:**

When you add `youtube.com`, all subdomains are blocked by default.

To block ONLY a subdomain, you would need to:

1. NOT add the parent domain
2. Add specific subdomains: `m.youtube.com`, `music.youtube.com`

However, this currently has limitations and may be improved in future updates.

### Issue: Wildcard not working

Example: `*news*` set but `news.example.com` not blocked

**Debug steps:**

1. Verify pattern syntax
   - ✅ `*news*` should work

2. Test with exact match
   - Try `news.example.com` as exact match

3. If still broken, please report an issue

---

## Summary

### Basic Usage

1. **Register simple domain** → `twitter.com`
2. **Use wildcards for broader blocking** → `*youtube*`
3. **Add descriptions for organization** → "Block during work"

### Recommended Patterns

- Exact match: `twitter.com` - Most reliable
- Contains: `*youtube*` - Includes related sites
- Subdomain: `*.reddit.com` - Specific subdomains only

---

## Support

If issues persist, please report on GitHub:

[https://github.com/anthropics/adalab shield/issues](https://github.com/anthropics/adalab shield/issues)

---

**Stay focused with adalab shield!** 🛡️✨
