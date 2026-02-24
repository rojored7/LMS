import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const configSchema = z.object({
  // Server Configuration
  PORT: z.string().transform(Number).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Sandbox Configuration
  SANDBOX_TIMEOUT: z.string().transform(Number).default('30000'),
  SANDBOX_MEMORY_LIMIT: z.string().default('256m'),
  SANDBOX_CPU_LIMIT: z.string().default('1'),
  SANDBOX_NETWORK_DISABLED: z.string().transform(val => val === 'true').default('true'),
  SANDBOX_IMAGE: z.string().default('ciber-sandbox:latest'),

  // Redis Configuration
  REDIS_URL: z.string(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('5'),

  // Docker Configuration
  DOCKER_SOCKET_PATH: z.string().default('/var/run/docker.sock'),
});

export type Config = z.infer<typeof configSchema>;

let configInstance: Config;

try {
  configInstance = configSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Configuration validation failed:');
    console.error(JSON.stringify(error.errors, null, 2));
    process.exit(1);
  }
  throw error;
}

export const config = configInstance;

// Language-specific configurations
export const LANGUAGE_CONFIGS = {
  python: {
    image: config.SANDBOX_IMAGE,
    command: ['python3'],
    fileExtension: 'py',
    fileName: 'script.py',
  },
  javascript: {
    image: config.SANDBOX_IMAGE,
    command: ['node'],
    fileExtension: 'js',
    fileName: 'script.js',
  },
  bash: {
    image: config.SANDBOX_IMAGE,
    command: ['bash'],
    fileExtension: 'sh',
    fileName: 'script.sh',
  },
} as const;

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIGS) as Array<keyof typeof LANGUAGE_CONFIGS>;
