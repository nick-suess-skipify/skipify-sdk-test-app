import { z } from "zod";

const phoneRegex = /^\d{10}$/;

export const ShopperSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional().refine((val) => !val || phoneRegex.test(val), {
    message: "Invalid phone number",
  }),
});
