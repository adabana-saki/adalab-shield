/**
 * Allowlist matching tests
 */

import { describe, it, expect } from 'vitest';
import {
  matchesAllowlistPattern,
  isAllowlisted,
} from '@/shared/utils/allowlist';

describe('matchesAllowlistPattern', () => {
  it('matches an exact host', () => {
    expect(matchesAllowlistPattern('example.com', 'example.com')).toBe(true);
  });

  it('matches subdomains of a plain entry', () => {
    expect(matchesAllowlistPattern('app.example.com', 'example.com')).toBe(
      true
    );
    expect(matchesAllowlistPattern('a.b.example.com', 'example.com')).toBe(
      true
    );
  });

  it('ignores a leading www. on both sides', () => {
    expect(matchesAllowlistPattern('www.example.com', 'example.com')).toBe(
      true
    );
    expect(matchesAllowlistPattern('example.com', 'www.example.com')).toBe(
      true
    );
  });

  it('does not match a different host', () => {
    expect(matchesAllowlistPattern('evil.com', 'example.com')).toBe(false);
    expect(matchesAllowlistPattern('notexample.com', 'example.com')).toBe(
      false
    );
  });

  it('does not treat a suffix as a subdomain', () => {
    // myexample.com must not match example.com
    expect(matchesAllowlistPattern('myexample.com', 'example.com')).toBe(false);
  });

  it('supports *.domain subdomain wildcards', () => {
    expect(matchesAllowlistPattern('a.example.com', '*.example.com')).toBe(
      true
    );
    expect(matchesAllowlistPattern('example.com', '*.example.com')).toBe(false);
  });

  it('supports substring wildcards', () => {
    expect(matchesAllowlistPattern('docs.example.com', '*example*')).toBe(true);
    expect(matchesAllowlistPattern('other.com', '*example*')).toBe(false);
  });

  it('treats an empty pattern as no match', () => {
    expect(matchesAllowlistPattern('example.com', '')).toBe(false);
    expect(matchesAllowlistPattern('example.com', '   ')).toBe(false);
  });
});

describe('isAllowlisted', () => {
  it('returns true when any entry matches', () => {
    expect(isAllowlisted('app.example.com', ['foo.com', 'example.com'])).toBe(
      true
    );
  });

  it('returns false for an empty allowlist', () => {
    expect(isAllowlisted('example.com', [])).toBe(false);
  });

  it('returns false when nothing matches', () => {
    expect(isAllowlisted('example.com', ['foo.com', 'bar.com'])).toBe(false);
  });
});
