import { z } from 'zod';

// MCP Server Configuration
export const ServerConfigSchema = z.object({
  port: z.number().default(3000),
  skipifyMerchantId: z.string(),
  skipifyApiKey: z.string().optional(),
  skipifyEnvironment: z.enum(['dev', 'stage', 'prod']).default('stage'),
  enableCors: z.boolean().default(true),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// Skipify SDK Operations
export const SkipifyLookupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const SkipifyAuthSchema = z.object({
  challengeId: z.string(),
  phone: z.string().optional(),
  sendOtp: z.boolean().default(false),
  displayMode: z.enum(['embedded', 'overlay']).default('embedded'),
  config: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    fontFamily: z.enum(['serif', 'sans-serif', 'default']).default('default'),
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    inputFieldSize: z.enum(['small', 'medium']).default('medium'),
  }).optional(),
});

export const SkipifyCarouselSchema = z.object({
  amount: z.number().positive(),
  phone: z.string().optional(),
  sendOtp: z.boolean().default(false),
  displayMode: z.enum(['embedded', 'overlay']).default('embedded'),
  config: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    fontFamily: z.enum(['serif', 'sans-serif', 'default']).default('default'),
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    inputFieldSize: z.enum(['small', 'medium']).default('medium'),
  }).optional(),
});

// Chat Message Types
export const ChatMessageSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  skipifySessionId: z.string().optional(),
  merchantId: z.string().optional(),
});

// MCP Tool Schemas
export const DeploySDKSchema = z.object({
  environment: z.enum(['dev', 'stage', 'prod']).default('stage'),
  merchantId: z.string(),
  platform: z.enum(['bigcommerce', 'shopify', 'custom', 'embedded-components']).default('embedded-components'),
});

export const TestSDKSchema = z.object({
  sessionId: z.string(),
  testType: z.enum(['lookup', 'auth', 'carousel', 'full-flow']),
  testData: z.record(z.unknown()).optional(),
});

export const CreateChatSessionSchema = z.object({
  merchantId: z.string().optional(),
  initialMessage: z.string().optional(),
});

export const SendChatMessageSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
  skipifyOperation: z.enum(['lookup', 'auth', 'carousel', 'none']).default('none'),
  skipifyData: z.record(z.unknown()).optional(),
});

// Response Types
export type SkipifyLookupResponse = {
  challengeId: string;
  flags: {
    phoneRequired: boolean;
    potentialPaymentMethods: boolean;
    partnerProvidedPhone: boolean;
  };
  metadata?: {
    maskedEmail?: string;
    maskedPhone?: string;
  };
  defaults?: {
    maskedChannel?: string;
    destination?: string;
  };
};

export type SkipifyAuthResponse = {
  shopperId: string;
  sessionId: string;
};

export type SkipifyCarouselResponse = {
  paymentId: string | null;
  sessionId?: string;
  metadata?: {
    networkType?: string;
    expiryDate?: string;
    lastFour?: string;
  };
  address?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
};

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>; 