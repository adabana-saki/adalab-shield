/**
 * Hosts that must never be blocked.
 *
 * Blocking these would break core flows — most importantly the adalab study
 * web app, which the extension integrates with (timer sync, remote control).
 * Accidentally adding it as a custom blocked domain would silently break the
 * integration, so it is filtered out everywhere blocking is decided.
 */
export const PROTECTED_HOSTS: readonly string[] = ['study.adalabtech.com'];

/**
 * True if the hostname is protected (exact match or a subdomain of one).
 */
export function isProtectedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, '');
  return PROTECTED_HOSTS.some((p) => h === p || h.endsWith(`.${p}`));
}
