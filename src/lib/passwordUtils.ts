// Dynamic imports to reduce bundle size

// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
  'qazwsx', 'trustno1', '654321', 'jordan23', 'harley', 'password1',
  '1234', 'robert', 'matthew', 'jordan', 'asshole', 'daniel',
  'andrew', 'charles', 'michael', 'james', 'william', 'david',
  'joseph', 'thomas', 'christopher', 'daniel', 'paul', 'mark',
  'donald', 'george', 'kenneth', 'steven', 'edward', 'brian',
  'ronald', 'anthony', 'kevin', 'jason', 'matthew', 'gary',
  'timothy', 'jose', 'larry', 'jeffrey', 'frank', 'scott',
  'eric', 'stephen', 'andrew', 'raymond', 'gregory', 'joshua',
  'jerry', 'dennis', 'walter', 'patrick', 'peter', 'harold',
  'douglas', 'henry', 'carl', 'arthur', 'ryan', 'roger'
];

/**
 * Validates password strength and security requirements
 * @param password - The password to validate
 * @param phone - User's phone number (to prevent inclusion in password)
 * @param email - User's email (to prevent inclusion in password)
 * @returns null if valid, error message if invalid
 */
export async function validatePassword(password: string, phone?: string, email?: string): Promise<string | null> {
  if (!password) {
    return 'Password is required.';
  }

  // Minimum length check - changed from 12 to 5
  if (password.length < 5) {
    return 'Password must be at least 5 characters long.';
  }

  // Check if password contains at least one number OR one alphabet
  const hasNumber = /\d/.test(password);
  const hasAlphabet = /[a-zA-Z]/.test(password);
  
  if (!hasNumber && !hasAlphabet) {
    return 'Password must contain at least one number or one alphabet.';
  }

  // Reject numeric-only passwords (but allow if it has alphabets too)
  if (/^\d+$/.test(password)) {
    return 'Password cannot be numbers only.';
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return 'Password is too common. Please choose a more unique password.';
  }

  // Prevent phone number in password
  if (phone) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (password.includes(cleanPhone) || cleanPhone.length >= 6 && password.includes(cleanPhone.substring(0, 6))) {
      return 'Password cannot contain your phone number.';
    }
  }

  // Prevent email username in password
  if (email) {
    const emailUsername = email.split('@')[0].toLowerCase();
    if (emailUsername.length >= 4 && password.toLowerCase().includes(emailUsername)) {
      return 'Password cannot contain your email username.';
    }
  }

  // Relaxed password strength check - only require score 1 instead of 3
  const zxcvbn = (await import('zxcvbn')).default;
  const result = zxcvbn(password);
  if (result.score < 1) {
    const feedback = result.feedback.suggestions.length > 0 
      ? ` ${result.feedback.suggestions[0]}` 
      : '';
    return `Password is too weak.${feedback}`;
  }

  return null; // Password is valid
}

/**
 * Hashes a password using Argon2id
 * @param password - The plain text password
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = (await import('argon2')).default;
    return await argon2.hash(password, {
      type: argon2.argon2id,
      timeCost: 2,
      memoryCost: 19456, // ~19MB
      parallelism: 1,
      hashLength: 32
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verifies a password against its hash using constant-time comparison
 * @param hash - The stored password hash
 * @param password - The plain text password to verify
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    const argon2 = (await import('argon2')).default;
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generates a secure random token for password reset
 * @param length - Length of the token in bytes (default: 32)
 * @returns Promise<string> - The generated token
 */
export async function generateResetToken(length: number = 32): Promise<string> {
  const crypto = await import('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hashes a reset token for secure storage
 * @param token - The plain reset token
 * @returns Promise<string> - The hashed token
 */
export async function hashResetToken(token: string): Promise<string> {
  return await hashPassword(token); // Reuse password hashing for tokens
}

/**
 * Verifies a reset token against its hash
 * @param hash - The stored token hash
 * @param token - The plain token to verify
 * @returns Promise<boolean> - True if token matches, false otherwise
 */
export async function verifyResetToken(hash: string, token: string): Promise<boolean> {
  return await verifyPassword(hash, token);
}

/**
 * Validates phone number format
 * @param phone - The phone number to validate
 * @returns boolean - True if valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  // Somali phone number format: +252XXXXXXXXX (9 digits after +252)
  const phoneRegex = /^\+252\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Normalizes phone number format
 * @param phone - The phone number to normalize
 * @returns string - The normalized phone number
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with 252, add +
  if (cleaned.startsWith('252') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If it's missing +252 prefix, add it
  if (cleaned.length === 9 && !cleaned.startsWith('+')) {
    return '+252' + cleaned;
  }
  
  return cleaned;
}
