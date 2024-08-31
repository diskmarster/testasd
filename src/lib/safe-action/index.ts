import { createSafeActionClient } from "next-safe-action";
import { ActionError } from "./error";

export const publicAction = createSafeActionClient({
  handleServerErrorLog(err, utils) {
    // TODO: implement third party logger or just insert into error table

    if (err instanceof ActionError) {
    console.error("ActionError thrown:", err, utils.bindArgsClientInputs)
    }

    console.error("Error thrown:", err, utils.bindArgsClientInputs)
  },
  handleReturnedServerError(err) {
    if (err instanceof ActionError) {
      return err.message
    }
    return "Intern server fejl"
  }
})
