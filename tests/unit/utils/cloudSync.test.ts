/**
 * Cloud sync config-picker tests.
 *
 * The picker is the safety boundary for what roams across devices: it must
 * carry configuration but never stats, history, or lock/security state.
 */

import { describe, it, expect } from 'vitest';
import { pickSyncableConfig } from '@/shared/utils/cloudSync';
import { DEFAULT_SETTINGS } from '@/shared/constants';

describe('pickSyncableConfig', () => {
  const picked = pickSyncableConfig(DEFAULT_SETTINGS);

  it('includes the configuration the user expects to roam', () => {
    expect(picked.platforms).toBeDefined();
    expect(picked.allowlist).toBeDefined();
    expect(picked.customDomains).toBeDefined();
    expect(picked.schedule).toBeDefined();
    expect(picked.blockPage).toBeDefined();
    expect(picked.preferences).toBeDefined();
  });

  it('never carries stats, history or lock/security state', () => {
    expect('stats' in picked).toBe(false);
    expect('timeTracking' in picked).toBe(false);
    expect('lockdown' in picked).toBe(false);
    expect('commitmentLock' in picked).toBe(false);
    expect('snoozeUntil' in picked).toBe(false);
  });

  it('produces shallow copies, not references to the source objects', () => {
    expect(picked.platforms).not.toBe(DEFAULT_SETTINGS.platforms);
    expect(picked.schedule).not.toBe(DEFAULT_SETTINGS.schedule);
  });
});
