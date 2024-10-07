import { z } from "zod";

export const forgotPasswordValidation = z.object({
	email: z.string().email(),
})
