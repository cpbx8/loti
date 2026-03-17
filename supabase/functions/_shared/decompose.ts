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

const SYSTEM_PROMPT = `You are a Mexican food ingredient decomposition expert.

Given a food name, determine if it's a composite food (made of multiple distinct components) or a single ingredient.

Return ONLY valid JSON (no markdown, no backticks) in this exact format:

For composite foods (tacos, tortas, chilaquiles, enchiladas, etc.):
{
  "composite": true,
  "components": [
    { "name": "corn tortilla", "name_es": "tortilla de maiz", "grams": 30 },
    { "name": "grilled steak", "name_es": "bistec asado", "grams": 80 }
  ]
}

For single ingredients (banana, rice, milk, etc.):
{
  "composite": false,
  "components": [
    { "name": "banana", "name_es": "platano", "grams": 120 }
  ]
}

Rules:
- Use typical Mexican portions and preparation methods
- A taco = tortilla + filling + typical toppings (onion, cilantro if relevant)
- A torta = bolillo bread + filling + typical toppings
- Enchiladas = tortilla + filling + sauce + cheese
- Be realistic about portion sizes in grams
- Include oils/fats if fried (e.g., "aceite para freir" for fried items)
- Keep it to the main components — don't list trace ingredients like salt
- Maximum 6 components per dish
- The name should be searchable in nutrition databases like FatSecret`

export interface FoodComponent {
  name: string
  name_es: string
  grams: number
}

export interface DecompositionResult {
  composite: boolean
  components: FoodComponent[]
}

export async function decomposeFood(query: string): Promise<DecompositionResult> {
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
          { role: "user", content: `Decompose: ${query}` },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`[decompose] HTTP ${res.status}`)
      return { composite: false, components: [{ name: query, name_es: query, grams: 100 }] }
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return { composite: false, components: [{ name: query, name_es: query, grams: 100 }] }
    }

    const parsed = JSON.parse(content) as DecompositionResult
    console.log(`[decompose] "${query}" → composite=${parsed.composite}, ${parsed.components.length} components`)

    // Validate
    if (!parsed.components || parsed.components.length === 0) {
      return { composite: false, components: [{ name: query, name_es: query, grams: 100 }] }
    }

    return parsed
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
