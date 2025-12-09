import { FaqEntry } from "./faq.types"

const faqEntries: FaqEntry[] = [
  {
    id: "create-table",
    question: "Hvordan opretter jeg en tabel?",
    keywords: ["opret", "tabel", "ny tabel"],
    answer:
      "Du kan oprette en tabel ved at vælge 'Opret tabel' i menuen og udfylde de obligatoriske felter.",
    locale: "da",
  },
  {
    id: "delete-row",
    question: "Hvorfor kan jeg ikke slette en række?",
    keywords: ["slet", "række", "delete"],
    answer:
      "En række kan kun slettes, hvis du har de nødvendige rettigheder. Kontakt en administrator, hvis du er i tvivl.",
    locale: "da",
  },
]

export const faqStore = {
  getByLocale(locale: string): FaqEntry[] {
    // fallback til dansk hvis sprog ikke findes
    const list = faqEntries.filter((e) => e.locale === locale)
    if (list.length > 0) return list
    return faqEntries.filter((e) => e.locale === "da")
  },
}
