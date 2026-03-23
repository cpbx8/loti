/**
 * Lightweight i18n — no library, just a context + dictionary.
 * Spanish default, English toggle.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type Language = 'es' | 'en'

const STORAGE_KEY = 'loti_language'

// ─── Translations ────────────────────────────────────────────

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Dashboard
    'greeting.morning': 'Buenos días',
    'greeting.afternoon': 'Buenas tardes',
    'greeting.evening': 'Buenas noches',
    'dashboard.summary': 'Tu resumen diario',
    'dashboard.tips': 'Consejos del día',
    'dashboard.recent': 'Escaneos recientes',
    'dashboard.viewAll': 'VER TODO',
    'dashboard.noScans': 'No hay escaneos hoy',
    'dashboard.scanFirst': 'Escanea tu primer alimento para ver tu curva de glucosa estimada.',
    'dashboard.currentLevel': 'NIVEL ACTUAL',
    'dashboard.stable': 'ESTABLE',
    'dashboard.elevated': 'ELEVADO',
    'dashboard.high': 'ALTO',
    'dashboard.disclaimer': 'Loti AI es solo para fines informativos. No sustituye el consejo médico profesional, diagnóstico o tratamiento. Siempre consulta a tu médico antes de hacer cambios en tu plan de manejo de diabetes.',

    // Tab bar
    'tab.history': 'Historial',
    'tab.favorites': 'Favoritos',

    // Scan menu
    'scan.photo': 'Escanear foto',
    'scan.barcode': 'Código de barras',
    'scan.text': 'Escribir alimento',

    // Text input
    'text.title': 'Buscar Alimento',
    'text.placeholder': 'ej. tacos al pastor, cheesecake, banana',
    'text.description': 'Escribe lo que comiste o quieres buscar',
    'text.search': 'Buscar',
    'text.searching': 'Buscando',
    'text.tryAgain': 'Intentar de nuevo',
    'text.searchAnother': 'Buscar otro',
    'text.examples': 'Ejemplos:',
    'text.analysis': 'Análisis de Alimento',
    'text.logSelected': 'Registrar selección',
    'text.logAll': 'Registrar todo',
    'text.log': 'Registrar',

    // Food result
    'result.scanResult': 'Resultado de escaneo',
    'result.lowImpact': 'BAJO IMPACTO',
    'result.moderate': 'MODERADO',
    'result.highImpact': 'ALTO IMPACTO',
    'result.lowDesc': 'Impacto bajo en tu glucosa.',
    'result.moderateDesc': 'Impacto moderado en tu glucosa.',
    'result.highDesc': 'Impacto alto en tu glucosa. Modera la porción.',
    'result.portion': 'Porción',
    'result.calories': 'Calorías',
    'result.carbs': 'Carbohidratos',
    'result.fiber': 'Fibra',
    'result.protein': 'Proteína',
    'result.swapTip': 'Consejo de Intercambio',
    'result.proTip': 'Consejo Pro',
    'result.proTipGreen': 'Acompáñalo con proteína para una comida completa y equilibrada.',
    'result.proTipYellow': 'Agrega verduras o ensalada para aumentar la fibra y reducir el impacto.',
    'result.proTipRed': 'Come la proteína y verduras primero, deja los carbohidratos para el final.',
    'result.saveFavorite': 'Guardar en favoritos',
    'result.inFavorites': 'En favoritos',
    'result.disclaimer': 'Estimación basada en tu perfil. No reemplaza monitoreo real (CGM).',
    'result.breakdown': 'Desglose',
    'result.glucoseResponse': 'Tu respuesta de glucosa estimada',
    'result.peakEstimate': 'Pico estimado:',
    'result.atMinutes': 'a los',
    'result.min': 'min',
    'result.returnsBase': 'Vuelve a tu base en',
    'result.hrs': 'hrs',

    // Favorites
    'favorites.title': 'Favoritos',
    'favorites.empty': 'Aún no tienes favoritos',
    'favorites.emptyDesc': 'Escanea un alimento y toca el corazón para guardarlo aquí',
    'favorites.searchFoods': 'Buscar alimentos',
    'favorites.back': 'Volver',
    'favorites.logToDiary': 'Registrar en diario',
    'favorites.badge': 'Favorito',
    'favorites.perServing': 'por porción',

    // History
    'history.title': 'Historial',
    'history.weeklyImpact': 'Impacto semanal',
    'history.green': 'Verde',
    'history.yellow': 'Amarillo',
    'history.red': 'Rojo',
    'history.noEntries': 'Sin escaneos esta semana',
    'history.removedFromLog': 'Eliminado del registro',

    // Settings
    'settings.title': 'Ajustes',
    'settings.language': 'Idioma',
    'settings.healthProfile': 'Perfil de Salud',
    'settings.a1c': 'A1C',
    'settings.notSet': 'Sin definir',
    'settings.aboutYou': 'Sobre Ti',
    'settings.age': 'Edad',
    'settings.yearsOld': 'años',
    'settings.sex': 'Sexo',
    'settings.activityLevel': 'Nivel de Actividad',
    'settings.medications': 'Medicamentos',
    'settings.dietaryRestrictions': 'Restricciones Alimentarias',
    'settings.edit': 'Editar',
    'settings.done': 'Listo',
    'settings.noRestrictions': 'Sin restricciones — toca Editar para agregar',
    'settings.restrictionsNote': 'Las sugerencias de IA y recomendaciones respetan estas restricciones.',
    'settings.subscription': 'Suscripción',
    'settings.status': 'Estado',
    'settings.premium': 'Premium',
    'settings.freeTrial': 'Prueba gratuita',
    'settings.daysLeft': 'día(s) restante(s)',
    'settings.trialExpired': 'Prueba expirada',
    'settings.scansToday': 'Escaneos Hoy',
    'settings.used': 'usados',
    'settings.remaining': 'restantes',
    'settings.manageSubscription': 'Administrar suscripción',
    'settings.upgradePremium': 'Mejorar a Premium',
    'settings.developer': 'Desarrollador',
    'settings.resetTrial': 'Reiniciar prueba (5 días nuevos)',
    'settings.activatePremium': 'Activar Premium (prueba)',
    'settings.expireTrial': 'Expirar prueba (probar paywall)',
    'settings.actions': 'Acciones',
    'settings.redoOnboarding': 'Repetir onboarding',
    'settings.clearData': 'Borrar datos y resetear',
    'settings.updateA1c': 'Actualizar A1C',
    'settings.enterA1c': 'Ingresa tu porcentaje de A1C más reciente (4.0 – 14.0)',
    'settings.cancel': 'Cancelar',
    'settings.save': 'Guardar',
    'settings.resetTitle': '¿Resetear todo?',
    'settings.resetDesc': 'Esto eliminará tu perfil, registro de alimentos y todos los datos en caché. Tendrás que hacer el onboarding de nuevo.',
    'settings.reset': 'Resetear',
    'settings.a1cNormal': 'Normal',
    'settings.a1cPrediabetic': 'Rango prediabético',
    'settings.a1cDiabetic': 'Rango diabético',
    'settings.sexMale': 'Masculino',
    'settings.sexFemale': 'Femenino',
    'settings.sexNotSpecified': 'Prefiero no decir',

    // Glucose chart zones
    'glucose.normal': 'NORMAL',
    'glucose.elevated': 'ELEVADA',
    'glucose.high': 'ALTA',
    'glucose.baseline': 'base',

    // Common
    'common.back': 'Volver',
  },

  en: {
    // Dashboard
    'greeting.morning': 'Good morning',
    'greeting.afternoon': 'Good afternoon',
    'greeting.evening': 'Good evening',
    'dashboard.summary': 'Your daily summary',
    'dashboard.tips': 'Tips of the day',
    'dashboard.recent': 'Recent scans',
    'dashboard.viewAll': 'VIEW ALL',
    'dashboard.noScans': 'No scans today',
    'dashboard.scanFirst': 'Scan your first food to see your estimated glucose curve.',
    'dashboard.currentLevel': 'CURRENT LEVEL',
    'dashboard.stable': 'STABLE',
    'dashboard.elevated': 'ELEVATED',
    'dashboard.high': 'HIGH',
    'dashboard.disclaimer': 'Loti AI is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your doctor before making changes to your diabetes management plan.',

    // Tab bar
    'tab.history': 'History',
    'tab.favorites': 'Favorites',

    // Scan menu
    'scan.photo': 'Scan photo',
    'scan.barcode': 'Barcode',
    'scan.text': 'Type food',

    // Text input
    'text.title': 'Search Food',
    'text.placeholder': 'e.g. tacos al pastor, cheesecake, banana',
    'text.description': 'Type what you ate or want to look up',
    'text.search': 'Search',
    'text.searching': 'Searching',
    'text.tryAgain': 'Try again',
    'text.searchAnother': 'Search another',
    'text.examples': 'Examples:',
    'text.analysis': 'Food Analysis',
    'text.logSelected': 'Log selected',
    'text.logAll': 'Log all',
    'text.log': 'Log',

    // Food result
    'result.scanResult': 'Scan result',
    'result.lowImpact': 'LOW IMPACT',
    'result.moderate': 'MODERATE',
    'result.highImpact': 'HIGH IMPACT',
    'result.lowDesc': 'Low impact on your glucose.',
    'result.moderateDesc': 'Moderate impact on your glucose.',
    'result.highDesc': 'High impact on your glucose. Moderate the portion.',
    'result.portion': 'Portion',
    'result.calories': 'Calories',
    'result.carbs': 'Carbohydrates',
    'result.fiber': 'Fiber',
    'result.protein': 'Protein',
    'result.swapTip': 'Swap Tip',
    'result.proTip': 'Pro Tip',
    'result.proTipGreen': 'Pair it with protein for a complete, balanced meal.',
    'result.proTipYellow': 'Add vegetables or salad to increase fiber and reduce impact.',
    'result.proTipRed': 'Eat protein and vegetables first, save carbs for last.',
    'result.saveFavorite': 'Save to favorites',
    'result.inFavorites': 'In favorites',
    'result.disclaimer': 'Estimate based on your profile. Does not replace real monitoring (CGM).',
    'result.breakdown': 'Breakdown',
    'result.glucoseResponse': 'Your estimated glucose response',
    'result.peakEstimate': 'Estimated peak:',
    'result.atMinutes': 'at',
    'result.min': 'min',
    'result.returnsBase': 'Returns to baseline in',
    'result.hrs': 'hrs',

    // Favorites
    'favorites.title': 'Favorites',
    'favorites.empty': 'No favorites yet',
    'favorites.emptyDesc': 'Scan a food and tap the heart to save it here',
    'favorites.searchFoods': 'Search foods',
    'favorites.back': 'Back',
    'favorites.logToDiary': 'Log to diary',
    'favorites.badge': 'Favorite',
    'favorites.perServing': 'per serving',

    // History
    'history.title': 'History',
    'history.weeklyImpact': 'Weekly Impact',
    'history.green': 'Green',
    'history.yellow': 'Yellow',
    'history.red': 'Red',
    'history.noEntries': 'No scans this week',
    'history.removedFromLog': 'Removed from log',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.healthProfile': 'Health Profile',
    'settings.a1c': 'A1C',
    'settings.notSet': 'Not set',
    'settings.aboutYou': 'About You',
    'settings.age': 'Age',
    'settings.yearsOld': 'years old',
    'settings.sex': 'Sex',
    'settings.activityLevel': 'Activity Level',
    'settings.medications': 'Medications',
    'settings.dietaryRestrictions': 'Dietary Restrictions',
    'settings.edit': 'Edit',
    'settings.done': 'Done',
    'settings.noRestrictions': 'None set — tap Edit to add',
    'settings.restrictionsNote': 'AI suggestions and recommendations respect these restrictions.',
    'settings.subscription': 'Subscription',
    'settings.status': 'Status',
    'settings.premium': 'Premium',
    'settings.freeTrial': 'Free trial',
    'settings.daysLeft': 'day(s) left',
    'settings.trialExpired': 'Trial expired',
    'settings.scansToday': 'Scans Today',
    'settings.used': 'used',
    'settings.remaining': 'remaining',
    'settings.manageSubscription': 'Manage subscription',
    'settings.upgradePremium': 'Upgrade to Premium',
    'settings.developer': 'Developer',
    'settings.resetTrial': 'Reset trial (new 5-day trial)',
    'settings.activatePremium': 'Activate Premium (test)',
    'settings.expireTrial': 'Expire trial (test paywall)',
    'settings.actions': 'Actions',
    'settings.redoOnboarding': 'Redo onboarding',
    'settings.clearData': 'Clear all data & reset',
    'settings.updateA1c': 'Update A1C',
    'settings.enterA1c': 'Enter your latest A1C percentage (4.0 – 14.0)',
    'settings.cancel': 'Cancel',
    'settings.save': 'Save',
    'settings.resetTitle': 'Reset everything?',
    'settings.resetDesc': 'This will clear your profile, food log, and all cached data. You\'ll need to go through onboarding again.',
    'settings.reset': 'Reset',
    'settings.a1cNormal': 'Normal',
    'settings.a1cPrediabetic': 'Prediabetic range',
    'settings.a1cDiabetic': 'Diabetic range',
    'settings.sexMale': 'Male',
    'settings.sexFemale': 'Female',
    'settings.sexNotSpecified': 'Prefer not to say',

    // Glucose chart zones
    'glucose.normal': 'NORMAL',
    'glucose.elevated': 'ELEVATED',
    'glucose.high': 'HIGH',
    'glucose.baseline': 'base',

    // Common
    'common.back': 'Back',
  },
}

// ─── Context ─────────────────────────────────────────────────

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'es') return stored
  } catch { /* ignore */ }
  return 'es'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
  }, [])

  const t = useCallback((key: string): string => {
    return translations[language][key] ?? translations.es[key] ?? key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider')
  return ctx
}
