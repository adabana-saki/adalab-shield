/**
 * Blocking rules types for content detection
 */

import type { Platform } from './settings';

/**
 * Detection method types
 */
export type DetectionMethod = 'url' | 'selector' | 'attribute' | 'mutation';

/**
 * Action to take when content is detected
 */
export type BlockingAction = 'hide' | 'redirect' | 'remove' | 'blur';

/**
 * URL-based detection rule
 */
export interface UrlRule {
  readonly type: 'url';
  readonly pattern: string; // RegExp pattern as string
  readonly action: BlockingAction;
  readonly priority: number;
}

/**
 * CSS selector-based detection rule
 */
export interface SelectorRule {
  readonly type: 'selector';
  readonly selector: string;
  readonly action: BlockingAction;
  readonly priority: number;
  readonly parentSelector?: string; // Optional parent to hide instead
}

/**
 * Attribute-based detection rule
 */
export interface AttributeRule {
  readonly type: 'attribute';
  readonly selector: string;
  readonly attribute: string;
  readonly pattern: string; // RegExp pattern to match attribute value
  readonly action: BlockingAction;
  readonly priority: number;
}

/**
 * Union type for all rule types
 */
export type BlockingRule = UrlRule | SelectorRule | AttributeRule;

/**
 * Platform-specific rule configuration
 */
export interface PlatformRules {
  readonly platform: Platform;
  readonly hosts: readonly string[];
  readonly urlRules: readonly UrlRule[];
  readonly selectorRules: readonly SelectorRule[];
  readonly attributeRules: readonly AttributeRule[];
}

/**
 * Custom user-defined rule
 */
export interface CustomRule {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly platform: Platform | 'all';
  readonly rule: BlockingRule;
  /**
   * Host patterns this rule applies to (same wildcard syntax as the allowlist).
   * Empty/undefined means it applies to every site.
   */
  readonly hosts?: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Type guard for BlockingRule
 */
export function isValidBlockingRule(value: unknown): value is BlockingRule {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  const validTypes: DetectionMethod[] = ['url', 'selector', 'attribute'];
  const validActions: BlockingAction[] = ['hide', 'redirect', 'remove', 'blur'];

  if (
    typeof obj.type !== 'string' ||
    !validTypes.includes(obj.type as DetectionMethod)
  ) {
    return false;
  }

  if (
    typeof obj.action !== 'string' ||
    !validActions.includes(obj.action as BlockingAction)
  ) {
    return false;
  }

  if (typeof obj.priority !== 'number') {
    return false;
  }

  switch (obj.type) {
    case 'url':
      return typeof obj.pattern === 'string';
    case 'selector':
      return typeof obj.selector === 'string';
    case 'attribute':
      return (
        typeof obj.selector === 'string' &&
        typeof obj.attribute === 'string' &&
        typeof obj.pattern === 'string'
      );
    default:
      return false;
  }
}
