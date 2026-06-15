/**
 * Allowlist matching.
 *
 * The allowlist is a set of user-specified hosts (optionally with wildcards)
 * that are exempt from ALL blocking — full-site, custom domains, short-video
 * detectors, schedules and focus. It is the user's escape hatch for a site
 * they never want touched.
 *
 * Patterns mirror the custom-domain syntax:
 * - `example.com`     exact host or any subdomain
 * - `*.example.com`   any subdomain of example.com
 * - `*example*`       contains "example" anywhere
 * - `example*`        starts with "example"
 */

/**
 * True if `hostname` matches a single allowlist `pattern`.
 */
export function matchesAllowlistPattern(
  hostname: string,
  pattern: string
): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  const pat = pattern
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');

  if (pat === '') {
    return false;
  }

  if (pat.includes('*')) {
    const escaped = pat
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(host);
  }

  // Exact host or subdomain match
  return host === pat || host.endsWith(`.${pat}`);
}

/**
 * True if `hostname` is exempt from blocking per the allowlist.
 */
export function isAllowlisted(
  hostname: string,
  allowlist: readonly string[]
): boolean {
  return allowlist.some((pattern) =>
    matchesAllowlistPattern(hostname, pattern)
  );
}
