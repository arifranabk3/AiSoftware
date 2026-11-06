import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  WEB_PORT: z.coerce.number().default(3000),

  // Database (MongoDB Atlas) & Cache (Redis)
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/ai_command_center'),
  MONGODB_DB_NAME: z.string().default('ai_command_center'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

  // Auth & Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  MASTER_ENCRYPTION_KEY: z
    .string()
    .min(32, 'MASTER_ENCRYPTION_KEY must be 32 characters for AES-256'),

  // Owner Controls
  OWNER_PHONE_NUMBER: z.string().min(8, 'OWNER_PHONE_NUMBER required for WhatsApp alerts'),
  OWNER_EMAIL: z.string().email().optional(),
  OWNER_INITIAL_PASSWORD: z.string().min(12, 'OWNER_INITIAL_PASSWORD must be at least 12 characters').optional(),

  // Frontend URL for strict CORS in production
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Zero-Cost External & Local Providers
  AI_PROVIDER: z.enum(['MOCK', 'GEMINI_FLASH', 'GROQ_LLAMA', 'OLLAMA_LOCAL']).default('MOCK'),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: z.string().default('llama3.2:1b'),
  HUGGING_FACE_TOKEN: z.string().optional(),

  // System Controls
  SYSTEM_EMERGENCY_HALT: z.coerce.boolean().default(false),
  ZERO_COST_STRICT_MODE: z.coerce.boolean().default(true)
}).superRefine((data, ctx) => {
  // Enforce High-Entropy & Reject Default/Known Placeholder Secrets in Production
  if (data.NODE_ENV === 'production') {
    const knownInsecurePatterns = [
      'test_jwt_secret',
      'test_refresh_secret',
      'test_master_encryption_key',
      '1234567890',
      'password',
      'changeme',
      'secret'
    ];

    const checkEntropy = (val: string, fieldName: string) => {
      const lower = val.toLowerCase();
      for (const pattern of knownInsecurePatterns) {
        if (lower.includes(pattern)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${fieldName} contains insecure or default test pattern '${pattern}' in production mode`,
            path: [fieldName]
          });
          return;
        }
      }

      // Shannon entropy calculation to enforce randomness
      const freq: Record<string, number> = {};
      for (const char of val) {
        freq[char] = (freq[char] || 0) + 1;
      }
      let entropy = 0;
      for (const count of Object.values(freq)) {
        const p = count / val.length;
        entropy -= p * Math.log2(p);
      }

      // Minimum Shannon entropy requirement for 32-char cryptographic keys is 3.5 bits/char
      if (entropy < 3.5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldName} has low Shannon entropy (${entropy.toFixed(2)} bits/char; required >= 3.5) in production mode`,
          path: [fieldName]
        });
      }
    };

    checkEntropy(data.JWT_SECRET, 'JWT_SECRET');
    checkEntropy(data.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET');
    checkEntropy(data.MASTER_ENCRYPTION_KEY, 'MASTER_ENCRYPTION_KEY');

    // In production, require distinct secrets for access and refresh tokens
    if (data.JWT_SECRET === data.REFRESH_TOKEN_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_SECRET and REFRESH_TOKEN_SECRET must be distinct cryptographic keys',
        path: ['REFRESH_TOKEN_SECRET']
      });
    }

    // In production, reject predictable default owner password
    if (data.OWNER_INITIAL_PASSWORD) {
      const lowerPass = data.OWNER_INITIAL_PASSWORD.toLowerCase();
      if (lowerPass.includes('ownersecurepass') || lowerPass.includes('password123') || lowerPass.includes('admin')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'OWNER_INITIAL_PASSWORD contains predictable or default credentials in production mode',
          path: ['OWNER_INITIAL_PASSWORD']
        });
      }
    }
  }
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(env: Record<string, unknown> = process.env): Environment {
  const parsed = environmentSchema.safeParse(env);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => `[${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');
    throw new Error(`CRITICAL CONFIGURATION ERROR:\n${errorMessages}`);
  }
  return parsed.data;
}

export function getSanitizedConfig(config: Environment): Record<string, unknown> {
  return {
    ...config,
    JWT_SECRET: '***MASKED***',
    REFRESH_TOKEN_SECRET: '***MASKED***',
    MASTER_ENCRYPTION_KEY: '***MASKED***',
    OWNER_INITIAL_PASSWORD: config.OWNER_INITIAL_PASSWORD ? '***MASKED***' : undefined,
    GEMINI_API_KEY: config.GEMINI_API_KEY ? '***MASKED***' : undefined,
    GROQ_API_KEY: config.GROQ_API_KEY ? '***MASKED***' : undefined,
    HUGGING_FACE_TOKEN: config.HUGGING_FACE_TOKEN ? '***MASKED***' : undefined,
    MONGODB_URI: config.MONGODB_URI.replace(/:\/\/.*@/, '://***:***@')
  };
}
