/**
 * Food emoji mapping — maps food names (ES/EN) to representative emojis.
 * Used in food log items, favorites, and anywhere food is displayed.
 */

const EMOJI_MAP: [string[], string][] = [
  [['apple', 'manzana'], '🍎'],
  [['salad', 'ensalada'], '🥗'],
  [['cake', 'pastel'], '🍰'],
  [['taco'], '🌮'],
  [['banana', 'plátano'], '🍌'],
  [['rice', 'arroz'], '🍚'],
  [['egg', 'huevo'], '🥚'],
  [['chicken', 'pollo'], '🍗'],
  [['fish', 'pescado'], '🐟'],
  [['bread', 'pan '], '🍞'],
  [['milk', 'leche'], '🥛'],
  [['cheese', 'queso'], '🧀'],
  [['soup', 'sopa', 'caldo'], '🍲'],
  [['coffee', 'café'], '☕'],
  [['juice', 'jugo'], '🧃'],
  [['water', 'agua'], '💧'],
  [['beer', 'cerveza'], '🍺'],
  [['pizza'], '🍕'],
  [['burger', 'hamburguesa'], '🍔'],
  [['fries', 'papas'], '🍟'],
  [['nopales', 'nopal'], '🌵'],
  [['avocado', 'aguacate'], '🥑'],
  [['bean', 'frijol'], '🫘'],
  [['corn', 'elote', 'maíz'], '🌽'],
  [['orange', 'naranja'], '🍊'],
  [['chocolate'], '🍫'],
  [['ice cream', 'helado'], '🍦'],
  [['cookie', 'galleta'], '🍪'],
  [['cereal'], '🥣'],
  [['yogurt'], '🥛'],
  [['fruit', 'fruta'], '🍇'],
  [['vegetable', 'verdura'], '🥬'],
  [['meat', 'carne'], '🥩'],
  [['shrimp', 'camarón'], '🦐'],
  [['sushi'], '🍣'],
  [['pasta'], '🍝'],
  [['sandwich', 'torta'], '🥪'],
]

const DEFAULT_EMOJI = '🍽️'

export function getFoodEmoji(name: string): string {
  const n = name.toLowerCase()
  for (const [keywords, emoji] of EMOJI_MAP) {
    if (keywords.some(k => n.includes(k))) return emoji
  }
  return DEFAULT_EMOJI
}
