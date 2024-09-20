import { Plan } from '@/data/customer.types'

export const plansConfig: PlanConfig[] = [
  {
    plan: 'lite',
    description: 'Til enkeltmands virksomheden',
    price: 490,
    userCount: 1,
    locations: 1,
    features: [
      '1 bruger',
      'Beholdningsstyring',
      'Import/export',
      'Varetekst 1, 2, 3',
      'Lagerliste',
      'Varegrupper',
      'Konto/sags styring',
      'Print stregkoder',
      'Scanner-app',
      'Rapporter via historik',
      '1 lokation',
    ],
  },
  {
    plan: 'plus',
    description: 'Til de små virksomheder',
    price: 990,
    userCount: 3,
    locations: 3,
    features: [
      'Alt fra Lite',
      '10 brugere',
      'Placerings-styring',
      'Genbestil',
      '3 lokationer',
    ],
  },
  {
    plan: 'pro',
    description: 'Til de store virksomheder',
    price: 1990,
    userCount: 20,
    locations: 10,
    features: [
      'Alt fra Plus',
      '20 brugere',
      'Batchnr',
      'Serienummer',
      'Ubegrænset lokationer',
    ],
  },
]

export type PlanConfig = {
  description: String
  plan: Plan
  price: number
  userCount: number
  locations: number
  features: string[]
}
