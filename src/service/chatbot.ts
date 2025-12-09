import { faqStore } from "@/data/faq"
import type { FaqEntry } from "@/data/faq.types"

export const chatbotService = {
  findBestMatch(message: string, locale: string): FaqEntry | null {
    const faq = faqStore.getByLocale(locale)
    const lower = message.toLowerCase()

    // Meget simpel keyword-matching (kan senere udbygges til “strategies”)
    const directMatch = faq.find((entry) =>
      entry.keywords.some((k) => lower.includes(k.toLowerCase())),
    )

    if (directMatch) return directMatch

    return null
  },
}
