import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  WEB_PORT: z.coerce.number().default(3000),

  // Database (MongoDB) & Cache (Redis)
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/ai_command_center'),
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

  // Zero-Cost External Providers
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  HUGGING_FACE_TOKEN: z.string().optional(),

  // System Controls
  SYSTEM_EMERGENCY_HALT: z.coerce.boolean().default(false),
  ZERO_COST_STRICT_MODE: z.coerce.boolean().default(true)
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
    GEMINI_API_KEY: config.GEMINI_API_KEY ? '***MASKED***' : undefined,
    GROQ_API_KEY: config.GROQ_API_KEY ? '***MASKED***' : undefined,
    HUGGING_FACE_TOKEN: config.HUGGING_FACE_TOKEN ? '***MASKED***' : undefined,
    MONGODB_URI: config.MONGODB_URI.replace(/:\/\/.*@/, '://***:***@')
  };
}
