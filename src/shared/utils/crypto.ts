/**
 * Cryptographic utilities for PIN hashing
 * Uses Web Crypto API for secure hashing
 */

/**
 * Hash a PIN using SHA-256
 * @param pin The PIN to hash
 * @returns The hex-encoded SHA-256 hash
 */
export async function hashPin(pin: string): Promise<string> {
  // Encode the PIN as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);

  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Verify a PIN against a stored hash
 * @param pin The PIN to verify
 * @param storedHash The stored hash to compare against
 * @returns True if the PIN matches the hash
 */
export async function verifyPin(
  pin: string,
  storedHash: string
): Promise<boolean> {
  const pinHash = await hashPin(pin);
  return pinHash === storedHash;
}

/**
 * Validate PIN format
 * PIN must be 4-8 digits
 * @param pin The PIN to validate
 * @returns True if the PIN format is valid
 */
export function isValidPinFormat(pin: string): boolean {
  // Must be 4-8 digits only
  return /^\d{4,8}$/.test(pin);
}
