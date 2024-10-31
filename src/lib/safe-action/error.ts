export class ActionError extends Error {}

export const ACTION_ERR_INTERNAL = 'Intern server fejl'
export const ACTION_ERR_UNAUTHORIZED = 'Adgang nægtet'
export const ACTION_ERR_NOTFOUND = (resource: string) => `Kunne ikke finde ${resource}`
