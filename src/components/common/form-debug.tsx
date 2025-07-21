import { UseFormReturn } from "react-hook-form"
import { Button } from "../ui/button"
import { Check, Copy, Loader2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

namespace FormDebug {
	export interface Props {
		form: UseFormReturn<any, any, undefined>
		/**
		* Error container is only visible if there are any errors
		*/
		showErrors?: boolean
	}
}

function flattenErrors(errors: any, prefix = ''): Array<[string, any]> {
	const result: Array<[string, any]> = []

	Object.entries(errors).forEach(([key, value]) => {
		const fullKey = prefix ? `${prefix}.${key}` : key

		if (value && typeof value === 'object' && 'message' in value) {
			result.push([fullKey, value])
		} else if (value && typeof value === 'object') {
			result.push(...flattenErrors(value, fullKey))
		}
	})

	return result
}

export function FormDebug({ form, showErrors = false }: FormDebug.Props) {
	const [hasCopied, setHasCopied] = useState(false)

	async function copy(str: string) {
		await navigator.clipboard.writeText(str)
	}

	function handleCopy(str: string) {
		setHasCopied(true)
		copy(str)
		setTimeout(() => setHasCopied(false), 1000)
	}

	const { formState: { isValid, isLoading, isSubmitting, errors } } = form
	const errorss = flattenErrors(errors)

	return (
		<div className={cn("relative", showErrors && "shadow-sm")}>
			<div className="absolute top-1 right-2 flex items-center gap-2 divide-neutral-950" >
				{isSubmitting && (
					<div className="flex items-center gap-1">
						<span className="text-sm font-medium font-mono">Submitting</span>
						<Loader2 className="size-3.5 animate-spin" />
					</div>
				)}
				{isLoading && (
					<div className="flex items-center gap-1">
						<span className="text-sm font-medium font-mono">Loading</span>
						<Loader2 className="size-3.5 animate-spin" />
					</div>
				)}
				{isValid ? (
					<span className="text-sm font-medium font-mono text-success">Valid</span>
				) : (
					<span className="text-sm font-medium font-mono text-destructive">Invalid</span>
				)}
				<Button size="icon" variant="ghost" onClick={() => handleCopy(JSON.stringify(form.watch(), null, 2))}>
					{hasCopied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
				</Button>
			</div>
			<pre className={cn("py-2 border px-3 bg-muted shadow-sm text-foreground font-mono rounded-md", (showErrors && errorss.length > 0) && "rounded-b-none shadow-none")}>{JSON.stringify(form.watch(), null, 2)}</pre>
			{(showErrors && errorss.length > 0) && (
				<div className="border border-t-0 overflow-hidden space-y-1 rounded-b-md bg-muted/25 py-2 px-3">
					<div className="flex items-center gap-2">
						<span className="text-sm text-destructive font-medium">Errors</span>
						{errorss.length > 0 && (
							<span className="text-sm text-muted-foreground">({errorss.length})</span>
						)}
					</div>
					<div className="flex flex-col gap-1">
						{errorss.length === 0 ? (
							<span className="text-sm text-muted-foreground">No errors</span>
						) : (
							errorss.map(([key, value]) => (
								<div key={key} className="text-sm">
									<span className="font-medium">{key}:</span>{' '}
									<span className="text-muted-foreground">{value?.message ?? 'Unknown reason'}</span>
									{value?.type && (
										<span className="text-muted-foreground">{' '}({value.type})</span>
									)}
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	)
}
