import { z } from "zod";

const phoneRegex = /^\d{10}$/;

export const ShopperSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional().refine((val) => !val || phoneRegex.test(val), {
    message: "Invalid phone number",
  }),
});

// Schema for authentication() options
export const AuthenticationOptionsSchema = z.object({
  onSuccess: z.function().args(z.object({
    shopperId: z.string(),
    sessionId: z.string()
  })),
  onError: z.function().args(z.any()),
  phone: z.string().optional().refine((val) => !val || phoneRegex.test(val), {
    message: "Invalid phone number",
  }),
  sendOtp: z.boolean().optional(),
  displayMode: z.enum(['embedded', 'overlay']).optional(),
  config: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    fontFamily: z.enum(['serif', 'sans-serif', 'default']).optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
  }).optional()
});

// Schema for lookup result passed to authentication()
export const LookupResponseSchema = z.object({
  challengeId: z.string(),
  flags: z.object({
    phoneRequired: z.boolean(),
    potentialPaymentMethods: z.boolean(),
    partnerProvidedPhone: z.boolean(),
  }),
  metadata: z.object({
    maskedEmail: z.string().optional(),
    maskedPhone: z.string().optional(),
  }).optional(),
  defaults: z.object({
    maskedChannel: z.string().optional(),
    destination: z.string().optional(),
  }).optional(),
});

// Schema for authentication success response
export const AuthenticationResponseSchema = z.object({
  shopperId: z.string(),
  sessionId: z.string()
});

export const CarouselOptionsSchema = z.object({
  onSelect: z.function().args(z.any()),
  onError: z.function().args(z.any()),
  orderTotal: z.number(),
  phone: z.string().optional().refine((val) => !val || phoneRegex.test(val), {
    message: "Invalid phone number",
  }),
  sendOtp: z.boolean().optional(),
  displayMode: z.enum(['embedded', 'overlay']).optional(),
  config: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    fontFamily: z.enum(['serif', 'sans-serif', 'default']).optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
  }).optional()
});
