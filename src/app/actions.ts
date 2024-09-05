"use server"

import { privateAction } from "@/lib/safe-action";
import { locationService } from "@/service/location";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const changeLocationValidation = z.object({ locationID: z.string(), revalidatePath: z.string() })

export const changeLocationAction = privateAction
  .schema(changeLocationValidation)
  .action(async ({ parsedInput }) => {
    console.log(parsedInput)
    locationService.setCookie(parsedInput.locationID)
    revalidatePath(parsedInput.revalidatePath)
  })
