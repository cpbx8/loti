import type { TrafficLight } from './shared'

export interface StoreProduct {
  id: string
  store_chain: string
  product_name: string
  brand: string | null
  category: string
  traffic_light: TrafficLight
  estimated_gl: number | null
  is_best_choice: boolean
  swap_suggestion: string | null
  why_tip: string | null
  why_detail: string | null
  price_mxn: number | null
  barcode: string | null
  serving_label: string | null
  image_url: string | null
}

export type TrafficFilter = 'all' | 'green' | 'yellow' | 'red'

export interface CategoryMeta {
  label: string
  emoji: string
  sortOrder: number
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  drinks_water:    { label: 'Water',                  emoji: '💧', sortOrder: 1 },
  drinks_soda:     { label: 'Sodas',                  emoji: '🥤', sortOrder: 2 },
  drinks_juice:    { label: 'Juice',                  emoji: '🧃', sortOrder: 3 },
  drinks_coffee:   { label: 'Coffee',                 emoji: '☕', sortOrder: 4 },
  drinks_energy:   { label: 'Energy Drinks',          emoji: '⚡', sortOrder: 5 },
  drinks_sports:   { label: 'Sports Drinks',          emoji: '🏃', sortOrder: 6 },
  drinks_dairy:    { label: 'Dairy Drinks',           emoji: '🥛', sortOrder: 7 },
  drinks_flavored: { label: 'Flavored Water',         emoji: '🫧', sortOrder: 8 },
  snacks_nuts:     { label: 'Nuts & Seeds',           emoji: '🥜', sortOrder: 9 },
  snacks_chips:    { label: 'Chips & Salty Snacks',   emoji: '🍿', sortOrder: 10 },
  snacks_candy:    { label: 'Candy & Chocolate',      emoji: '🍫', sortOrder: 11 },
  snacks_bars:     { label: 'Bars & Cookies',         emoji: '🍪', sortOrder: 12 },
  snacks_jerky:    { label: 'Jerky & Meat Snacks',    emoji: '🥩', sortOrder: 13 },
  hot_food:        { label: 'Hot Food',               emoji: '🌭', sortOrder: 14 },
  dairy_yogurt:    { label: 'Yogurt',                 emoji: '🥄', sortOrder: 15 },
  dairy_cheese:    { label: 'Cheese',                 emoji: '🧀', sortOrder: 16 },
  bread_bakery:    { label: 'Bread & Bakery',         emoji: '🍞', sortOrder: 17 },
  prepared_food:   { label: 'Prepared Food',          emoji: '🍱', sortOrder: 18 },
  frozen_treats:   { label: 'Ice Cream & Frozen',     emoji: '🍦', sortOrder: 19 },
}

export function getCategoryMeta(key: string): CategoryMeta {
  return CATEGORY_META[key] ?? { label: key, emoji: '📦', sortOrder: 99 }
}

export const OXXO_HACKS = [
  'Peanuts + beef jerky + water = a complete low-GI meal at OXXO',
  'Ask for the hot dog sausage without the bun — the bun is the glucose spike',
  'Andatti black coffee is at every OXXO and has zero glucose impact',
  'Nuts are always near the register — grab them instead of candy',
  'Flavored Ciel and Peñafiel have sugar — stick with plain mineral water',
  'Mazapán is the lowest-impact candy at OXXO thanks to its peanut base',
  'Small bags of chips (45g) are yellow, not red — portion size matters',
  'Greek yogurt (plain) is usually in the back fridge — worth the walk',
]
