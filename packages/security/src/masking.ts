/**
 * Sensitive Data & Credential Masking Engine
 * Strictly redacts passwords, JWTs, API keys, private keys, connection strings, and tokens.
 */

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /bearer/i,
  /credential/i,
  /private/i,
  /cert/i,
  /otp/i,
  /pin/i
];

const SENSITIVE_STRING_PATTERNS = [
  // JWT
  /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  // MongoDB Connection String with credentials
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi,
  // Redis Connection String with password
  /redis:\/\/:[^@]+@/gi,
  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9._-]+/gi
];

export function redactSensitiveData(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    let sanitized = input;
    for (const pattern of SENSITIVE_STRING_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_CREDENTIAL]');
    }
    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item));
  }

  if (typeof input === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitiveKey) {
        copy[key] = '[REDACTED]';
      } else {
        copy[key] = redactSensitiveData(value);
      }
    }
    return copy;
  }

  return input;
}

export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED_EMAIL]';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}
