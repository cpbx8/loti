/**
 * Food Decomposition — Uses GPT-4o-mini to break composite foods into components.
 *
 * "bistec taco" → ["corn tortilla", "bistec (grilled steak)"]
 * "chilaquiles verdes" → ["tortilla chips", "salsa verde", "crema", "queso fresco"]
 * "banana" → ["banana"]  (single item, no decomposition needed)
 *
 * Cost: ~$0.00008 per call (GPT-4o-mini)
 */

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!
const TIMEOUT_MS = 5000

const SYSTEM_PROMPT = `You are a food ingredient decomposition expert.

Given a food query, determine if it refers to multiple distinct foods/components or a single food item.

Return ONLY valid JSON (no markdown, no backticks) in this exact format:

For composite or multi-food queries:
{
  "composite": true,
  "components": [
    { "name": "scrambled eggs", "name_es": "huevos revueltos", "grams": 150 },
    { "name": "avocado", "name_es": "aguacate", "grams": 75 }
  ]
}

For single food items:
{
  "composite": false,
  "components": [
    { "name": "banana", "name_es": "platano", "grams": 120 }
  ]
}

IMPORTANT — Mark as composite (true) when:
1. The query explicitly lists multiple foods: "eggs and avocado", "rice and beans", "chicken con arroz"
2. The query uses connectors: "and", "y", "con", "with", "+", commas between distinct foods
3. The food is a composed dish made of distinct components: tacos, tortas, enchiladas, chilaquiles, etc.

Mark as composite (false) ONLY when:
- It is clearly a single ingredient or single food item (banana, rice, milk, chicken breast)

Rules:
- Use typical Mexican portions and preparation methods when applicable
- For explicit multi-food lists ("X and Y"), treat each listed food as its own component
- A taco = tortilla + filling + typical toppings (onion, cilantro if relevant)
- A torta = bolillo bread + filling + typical toppings
- Enchiladas = tortilla + filling + sauce + cheese
- Be realistic about portion sizes in grams
- Only include ingredients that are CORE — no cooking oils, seasonings, or garnishes unless explicitly mentioned
- Example: "eggs and avocado" → composite=true, [eggs 150g, avocado 75g]
- Example: "3 eggs and avocado" → composite=true, [eggs 150g (for 3 eggs), avocado 75g]
- NEVER infer a cooking method — use the plain ingredient name as-is. "eggs" → "eggs", NOT "scrambled eggs" or "fried eggs". "chicken" → "chicken", NOT "grilled chicken". Only use a preparation if the user explicitly stated it (e.g. "fried eggs", "grilled chicken").
- Example: "pasta with meatballs" → composite=true, [pasta 180g, meatballs 120g]
- Example: "tacos al pastor" → composite=true, [tortilla 30g, pork al pastor 80g, pineapple 20g, onion 10g, cilantro 5g]
- Keep it to main components — don't list trace ingredients like salt
- Maximum 6 components
- Names should be searchable in nutrition databases like FatSecret`

export interface FoodComponent {
  name: string
  name_es: string
  grams: number
}

export interface DecompositionResult {
  composite: boolean
  components: FoodComponent[]
  quantity: number
  baseName: string
}

/** Extract leading quantity from query: "3 shrimp tacos" → { qty: 3, food: "shrimp tacos" } */
function extractQuantity(query: string): { qty: number; food: string } {
  const m = query.match(/^(\d+(?:\.\d+)?)\s+(.+)$/i)
  if (m) return { qty: parseFloat(m[1]), food: m[2] }

  // Word quantities
  const words: Record<string, number> = {
    a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
    un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    half: 0.5, medio: 0.5, media: 0.5,
  }
  const first = query.split(/\s+/)[0].toLowerCase()
  if (words[first] != null) {
    return { qty: words[first], food: query.replace(/^\S+\s+/, '') }
  }

  // "1 cup" style — extract measurement
  const cup = query.match(/^(\d+(?:\.\d+)?)\s+(cups?|tazas?|oz|ounces?|porciones?|servings?)\s+(?:of\s+|de\s+)?(.+)$/i)
  if (cup) return { qty: parseFloat(cup[1]), food: cup[3] }

  return { qty: 1, food: query }
}

export async function decomposeFood(query: string): Promise<DecompositionResult> {
  const { qty, food } = extractQuantity(query)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Decompose: ${food}` },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`[decompose] HTTP ${res.status}`)
      return { composite: false, components: [{ name: food, name_es: food, grams: Math.round(100 * qty) }], quantity: qty, baseName: food }
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return { composite: false, components: [{ name: food, name_es: food, grams: Math.round(100 * qty) }], quantity: qty, baseName: food }
    }

    const parsed = JSON.parse(content) as { composite: boolean; components: FoodComponent[] }
    console.log(`[decompose] "${query}" → qty=${qty}, composite=${parsed.composite}, ${parsed.components.length} components`)

    // Validate
    if (!parsed.components || parsed.components.length === 0) {
      return { composite: false, components: [{ name: food, name_es: food, grams: 100 * qty }], quantity: qty, baseName: food }
    }

    // Scale component grams by quantity
    const scaledComponents = parsed.components.map(c => ({
      ...c,
      grams: Math.round(c.grams * qty),
    }))

    return { ...parsed, components: scaledComponents, quantity: qty, baseName: food }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.log(`[decompose] TIMEOUT for "${query}"`)
    } else {
      console.error(`[decompose] error for "${query}":`, err)
    }
    // Fallback: treat as single item
    return { composite: false, components: [{ name: query, name_es: query, grams: 100 }] }
  }
}
