import { Plan } from "@/data/customer.types"

export const plan: PlanConfig[] = [
  {
    plan: 'lite',
    price: 299,
    userCount: 1,
    features: [
      "feature 1",
      "feature 2",
      "feature 3",
    ],
  },
  {
    plan: 'basis',
    price: 499,
    userCount: 3,
    features: [
      "feature 1",
      "feature 2",
      "feature 3",
    ],
  },
  {
    plan: 'pro',
    price: 799,
    userCount: 20,
    features: [
      "feature 1",
      "feature 2",
      "feature 3",
    ],
  },
]

type PlanConfig = {
  plan: Plan,
  price: number
  userCount: number
  features: string[]
}
