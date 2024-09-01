import { planZodSchema } from "@/data/customer.types";
import { z } from "zod";

export const createCustomerValidation = z.object({
  company: z.string().min(2, { message: "Firmanavn skal minimum være 2 karakterer" }),
  email: z.string().email({ message: 'Email skal være gyldig' }),
  plan: planZodSchema
})
