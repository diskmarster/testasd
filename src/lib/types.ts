/** Creates a new type where the provided keys are required, and the rest are optional */
export type PartialRequired<Type, Keys extends keyof Type> = Required<
	Pick<Type, Keys>
> &
	Partial<Omit<Type, Keys>>
