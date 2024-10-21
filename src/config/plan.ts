import { Plan } from '@/data/customer.types'

export const plansConfig: PlanConfig[] = [
  {
    plan: 'lite',
    description: 'Til enkeltmands virksomheden',
    price: 490,
    userCount: 1,
    locations: 1,
  },
  {
    plan: 'plus',
    description: 'Til de små virksomheder',
    price: 990,
    userCount: 3,
    locations: 3,
  },
  {
    plan: 'pro',
    description: 'Til de store virksomheder',
    price: 1990,
    userCount: 20,
    locations: 10,
  },
]

export type PlanConfig = {
  description: String
  plan: Plan
  price: number
  userCount: number
  locations: number
}
