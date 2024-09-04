"use server"

import { privateAction } from "@/lib/safe-action";
import { locationService } from "@/service/location";
import { z } from "zod";

const changeLocationValidation = z.object({ locationID: z.coerce.number() })

export const changeLocationAction = privateAction
  .schema(changeLocationValidation)
  .action(async ({ parsedInput }) => {
    console.log(parsedInput)
    locationService.setCookie(parsedInput.locationID)
  })
