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
    'dashboard.disclaimer': 'Loti AI es solo para fines informativos. No sustituye el consejo médico profesional, diagnóstico o tratamiento. Siempre consulta a tu médico antes de hacer cambios en tu plan de manejo de diabetes.',

    // Streak
    'streak.start': '¡Comienza tu racha!',
    'streak.days': 'racha de {{count}} día(s)',
    'streak.milestone7': '¡1 semana! 🎉',
    'streak.milestone30': '¡1 mes! 🏆',

    // Daily insight
    'insight.allGreen': '¡Todo verde hoy! 🌿 Excelente',
    'insight.greenCount': '{{count}} alimentos verdes hoy',
    'insight.bestDay': '— ¡tu mejor día!',
    'insight.encourageGreen': 'Intenta agregar un alimento verde mañana',
    'insight.greatStart': '¡Buen comienzo! Sigue registrando para ver tu resumen',
    'dashboard.scanFirsti18n': 'Toca el botón + para escanear tu primer alimento',

    // Dashboard hero
    'dashboard.hero.label': 'Tu Glucosa Hoy',
    'dashboard.meals.label': 'Comidas de Hoy',
    'dashboard.mood.green.1': 'Todo bajo control',
    'dashboard.mood.green.2': 'Excelente',
    'dashboard.mood.green.3': 'Así se hace',
    'dashboard.mood.yellow.1': 'No está mal — puedes mejorar',
    'dashboard.mood.yellow.2': 'Cuida la siguiente',
    'dashboard.mood.red.1': 'Día difícil — mañana es nuevo',
    'dashboard.mood.empty': 'Sin comidas registradas',
    'dashboard.empty.greeting': '¿Qué vamos a desayunar?',
    'dashboard.empty.subtitle': 'Escanea o busca tu primera comida y te sigo la glucosa todo el día.',
    'dashboard.empty.cta': 'Escanear comida',
    'dashboard.nudge.title': '¿Quieres balancear tu día?',
    'dashboard.nudge.subtitle': 'Te sugiero algo verde para compensar 🌿',

    // Food detail
    'foodDetail.portion': 'Porción',
    'foodDetail.serving': 'porción',
    'foodDetail.servings': 'porciones',
    'foodDetail.nutrition': 'Nutrición',
    'foodDetail.calories': 'Calorías',
    'foodDetail.carbs': 'Carbohidratos',
    'foodDetail.protein': 'Proteína',
    'foodDetail.fat': 'Grasa',
    'foodDetail.fiber': 'Fibra',
    'foodDetail.gl': 'Carga Glucémica',
    'foodDetail.glucoseImpact': 'Impacto en Glucosa',
    'foodDetail.save': 'Guardar cambios',
    'foodDetail.deleteTitle': '¿Eliminar este alimento?',
    'foodDetail.deleteMessage': 'Esta acción no se puede deshacer.',
    'foodDetail.delete': 'Eliminar',

    // Tab bar
    'tab.history': 'Historial',
    'tab.favorites': 'Favoritos',

    // History screen
    'history.title': 'Historial',
    'history.weeklyImpact': 'Impacto Semanal',
    'history.green': 'Verde',
    'history.yellow': 'Amarillo',
    'history.red': 'Rojo',
    'history.dailyBreakdown': 'Desglose Diario',
    'history.thisWeek': 'Esta Semana',
    'history.daysLogged': 'días registrados esta semana',
    'history.dayByDay': 'Día a Día',
    'history.itemsLogged': '{{count}} alimentos registrados',
    'history.noMeals': 'Sin comidas registradas',

    // Onboarding CTA
    'onboarding.scanFirst': 'Escanea tu primer alimento',
    'onboarding.welcomeTitle': 'Mira cómo tu comida afecta tu glucosa',
    'onboarding.welcomeSub': 'Toma una foto. Obtén una calificación roja/amarilla/verde al instante.',

    // Scan menu
    'scan.photo': 'Escanear foto',
    'scan.barcode': 'Código de barras',
    'scan.text': 'Escribir alimento',
    'scan.mealIdeas': 'Ideas',

    // Scan - Loti's Kitchen
    'scan.greeting': '¿Qué vamos a comer?',
    'scan.greetingSub': 'Enséñale tu plato a Loti',
    'scan.takePhoto': 'Tomar foto',
    'scan.takePhotoSub': 'Apunta a tu plato',
    'scan.fromGallery': 'Elegir de galería',
    'scan.fromGallerySub': 'Selecciona una foto',
    'scan.typeInstead': 'O escribe lo que comiste',
    'scan.analyzing1': 'Déjame ver...',
    'scan.analyzing2': 'Hmm, interesante...',
    'scan.analyzing3': 'Buscando los ingredientes...',
    'scan.analyzing4': '¡Ya casi!',
    'scan.errorTitle': 'Hmm, no pude descifrar eso',
    'scan.errorNoFood': 'No pude identificar comida en esta foto',
    'scan.errorSub': 'Intenta con una foto más clara o escribe el alimento',
    'scan.tryAgain': 'Intentar de nuevo',
    'scan.errorTypeInstead': 'Escribir alimento',
    'scan.permissionNeeded': 'Loti necesita acceso a la cámara para escanear tu comida',
    'scan.openSettings': 'Abrir Ajustes',
    'scan.moreIngredients': '+{{count}} más',

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
    'result.actual': 'Actual',
    'result.alternative': 'Alternativa',
    'result.less': 'menos',

    // Editable meal
    'meal.ingredients': 'Ingredientes',
    'meal.addIngredient': 'Agregar ingrediente',
    'meal.searchPlaceholder': 'Buscar ingrediente...',
    'meal.search': 'Buscar',
    'meal.noResults': 'Sin resultados',
    'meal.logMeal': 'Registrar comida',
    'meal.emptyTitle': 'Sin ingredientes',
    'meal.emptyDesc': 'Agrega lo que comiste para ver el impacto',
    'meal.searchError': 'Error al buscar. Intenta de nuevo.',
    'meal.editPortion': 'Editar porción',

    // Favorites
    'favorites.title': 'Favoritos',
    'favorites.empty': 'Aún no tienes favoritos',
    'favorites.emptyDesc': 'Escanea un alimento y toca el corazón para guardarlo aquí',
    'favorites.searchFoods': 'Buscar alimentos',
    'favorites.back': 'Volver',
    'favorites.logToDiary': 'Registrar en diario',
    'favorites.badge': 'Favorito',
    'favorites.perServing': 'por porción',

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
    'settings.disclaimer': 'Loti AI es solo para fines informativos. No sustituye el consejo médico profesional, diagnóstico o tratamiento. Siempre consulta a tu médico antes de hacer cambios en tu plan de manejo de diabetes.',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',

    // Tips
    'tips.mythbuster': 'MITO',
    'tips.swap': 'INTERCAMBIO',
    'tips.modifier': 'HÁBITO ACTIVO',
    'tips.featuredFood': 'NUTRICIÓN',
    'tips.didYouKnow': '¿SABÍAS QUE?',

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
    'settings.legal': 'Legal',
    'settings.privacy': 'Política de Privacidad',
    'settings.terms': 'Términos de Servicio',
    'settings.actions': 'Acciones',
    'settings.redoOnboarding': 'Repetir onboarding',
    'settings.clearData': 'Borrar datos y resetear',
    'settings.clearConfirmTitle': '¿Resetear todo?',
    'settings.clearConfirmMessage': 'Esto eliminará tu perfil, registro de alimentos y todos los datos. Tendrás que hacer el onboarding de nuevo.',
    'settings.clearConfirmButton': 'Resetear',
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
    'glucose.currentLevel': 'Nivel actual',
    'glucose.statusStable': 'ESTABLE',
    'glucose.statusElevated': 'ELEVADO',
    'glucose.statusHigh': 'ALTO',
    'glucose.descStable': 'Tu glucosa está estable hoy. Has mantenido un rango óptimo durante las últimas horas.',
    'glucose.descElevated': 'Tu glucosa está algo elevada. Considera agregar fibra o proteína a tu próxima comida.',
    'glucose.descHigh': 'Tu glucosa está alta. Intenta caminar 10 minutos o beber agua.',
    'glucose.descEmpty': 'Escanea tu primer alimento para ver tu curva de glucosa estimada.',
    'glucose.peakEstimate': 'Pico estimado:',
    'glucose.peakAt': 'a los',
    'glucose.peakMin': 'min.',
    'glucose.returnBase': 'Vuelve a tu base en ~',
    'glucose.returnHrs': 'hrs.',

    // Traffic light labels (food log)
    'tl.green': 'BAJO',
    'tl.yellow': 'MEDIO',
    'tl.red': 'ALTO',

    // Common
    'common.back': 'Volver',
    'common.closeMenu': 'Cerrar menú',
    'common.addFood': 'Agregar alimento',
    'common.aiMealIdeas': 'Ideas de comida con IA',
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
    'dashboard.disclaimer': 'Loti AI is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your doctor before making changes to your diabetes management plan.',

    // Streak
    'streak.start': 'Start your streak!',
    'streak.days': '{{count}}-day streak',
    'streak.milestone7': '1 week! 🎉',
    'streak.milestone30': '1 month! 🏆',

    // Daily insight
    'insight.allGreen': 'All green today! 🌿 Amazing',
    'insight.greenCount': '{{count}} green foods today',
    'insight.bestDay': '— your best day!',
    'insight.encourageGreen': 'Try adding a green food tomorrow',
    'insight.greatStart': 'Great start! Keep logging to see your daily insight',
    'dashboard.scanFirsti18n': 'Tap the + button to scan your first food',

    // Dashboard hero
    'dashboard.hero.label': "Today's Glucose",
    'dashboard.meals.label': "Today's Meals",
    'dashboard.mood.green.1': 'Smooth sailing',
    'dashboard.mood.green.2': 'Looking great',
    'dashboard.mood.green.3': 'Steady as she goes',
    'dashboard.mood.yellow.1': 'Not bad — room to improve',
    'dashboard.mood.yellow.2': 'Watch the next one',
    'dashboard.mood.red.1': "Rough day — tomorrow's a fresh start",
    'dashboard.mood.empty': 'No meals logged yet',
    'dashboard.empty.greeting': "What's for breakfast?",
    'dashboard.empty.subtitle': "Scan or search your first meal and I'll track your glucose all day.",
    'dashboard.empty.cta': 'Scan a meal',
    'dashboard.nudge.title': 'Want to balance your day?',
    'dashboard.nudge.subtitle': 'Let me suggest something green to compensate 🌿',

    // Food detail
    'foodDetail.portion': 'Portion',
    'foodDetail.serving': 'serving',
    'foodDetail.servings': 'servings',
    'foodDetail.nutrition': 'Nutrition',
    'foodDetail.calories': 'Calories',
    'foodDetail.carbs': 'Carbs',
    'foodDetail.protein': 'Protein',
    'foodDetail.fat': 'Fat',
    'foodDetail.fiber': 'Fiber',
    'foodDetail.gl': 'Glycemic Load',
    'foodDetail.glucoseImpact': 'Glucose Impact',
    'foodDetail.save': 'Save changes',
    'foodDetail.deleteTitle': 'Delete this food?',
    'foodDetail.deleteMessage': 'This action cannot be undone.',
    'foodDetail.delete': 'Delete',

    // Tab bar
    'tab.history': 'History',
    'tab.favorites': 'Favorites',

    // History screen
    'history.title': 'History',
    'history.weeklyImpact': 'Weekly Impact',
    'history.green': 'Green',
    'history.yellow': 'Yellow',
    'history.red': 'Red',
    'history.dailyBreakdown': 'Daily Breakdown',
    'history.thisWeek': 'This Week',
    'history.daysLogged': 'days logged this week',
    'history.dayByDay': 'Day by Day',
    'history.itemsLogged': '{{count}} items logged',
    'history.noMeals': 'No meals logged',

    // Onboarding CTA
    'onboarding.scanFirst': 'Scan your first food',
    'onboarding.welcomeTitle': 'See how your food affects your glucose',
    'onboarding.welcomeSub': 'Snap a photo. Get an instant red/yellow/green rating.',

    // Scan menu
    'scan.photo': 'Scan photo',
    'scan.barcode': 'Barcode',
    'scan.text': 'Type food',
    'scan.mealIdeas': 'Ideas',

    // Scan - Loti's Kitchen
    'scan.greeting': 'What are we eating?',
    'scan.greetingSub': 'Show Loti your plate',
    'scan.takePhoto': 'Take a photo',
    'scan.takePhotoSub': 'Point at your plate',
    'scan.fromGallery': 'Choose from gallery',
    'scan.fromGallerySub': 'Pick a food pic',
    'scan.typeInstead': 'Or type what you ate',
    'scan.analyzing1': 'Let me take a look...',
    'scan.analyzing2': 'Hmm, interesting...',
    'scan.analyzing3': 'Finding the ingredients...',
    'scan.analyzing4': 'Almost there!',
    'scan.errorTitle': "Hmm, I couldn't figure that out",
    'scan.errorNoFood': "I couldn't identify any food in this photo",
    'scan.errorSub': 'Try a clearer photo or type what you ate',
    'scan.tryAgain': 'Try again',
    'scan.errorTypeInstead': 'Type instead',
    'scan.permissionNeeded': 'Loti needs camera access to scan your food',
    'scan.openSettings': 'Open Settings',
    'scan.moreIngredients': '+{{count}} more',

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
    'result.actual': 'Actual',
    'result.alternative': 'Alternative',
    'result.less': 'less',

    // Editable meal
    'meal.ingredients': 'Ingredients',
    'meal.addIngredient': 'Add ingredient',
    'meal.searchPlaceholder': 'Search ingredient...',
    'meal.search': 'Search',
    'meal.noResults': 'No results found',
    'meal.logMeal': 'Log meal',
    'meal.emptyTitle': 'No ingredients',
    'meal.emptyDesc': 'Add what you ate to see the impact',
    'meal.searchError': 'Search failed. Try again.',
    'meal.editPortion': 'Edit portion',

    // Favorites
    'favorites.title': 'Favorites',
    'favorites.empty': 'No favorites yet',
    'favorites.emptyDesc': 'Scan a food and tap the heart to save it here',
    'favorites.searchFoods': 'Search foods',
    'favorites.back': 'Back',
    'favorites.logToDiary': 'Log to diary',
    'favorites.badge': 'Favorite',
    'favorites.perServing': 'per serving',

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
    'settings.disclaimer': 'Loti AI is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your doctor before making changes to your diabetes management plan.',
    'common.save': 'Save',
    'common.cancel': 'Cancel',

    // Tips
    'tips.mythbuster': 'MYTH',
    'tips.swap': 'SWAP',
    'tips.modifier': 'ACTIVE HABIT',
    'tips.featuredFood': 'NUTRITION',
    'tips.didYouKnow': 'DID YOU KNOW?',

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
    'settings.legal': 'Legal',
    'settings.privacy': 'Privacy Policy',
    'settings.terms': 'Terms of Service',
    'settings.actions': 'Actions',
    'settings.redoOnboarding': 'Redo onboarding',
    'settings.clearData': 'Clear all data & reset',
    'settings.clearConfirmTitle': 'Reset everything?',
    'settings.clearConfirmMessage': 'This will delete your profile, food log, and all data. You will need to redo onboarding.',
    'settings.clearConfirmButton': 'Reset',
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
    'glucose.currentLevel': 'Current level',
    'glucose.statusStable': 'STABLE',
    'glucose.statusElevated': 'ELEVATED',
    'glucose.statusHigh': 'HIGH',
    'glucose.descStable': 'Your glucose is stable today. You have maintained an optimal range over the last few hours.',
    'glucose.descElevated': 'Your glucose is slightly elevated. Consider adding fiber or protein to your next meal.',
    'glucose.descHigh': 'Your glucose is high. Try walking 10 minutes or drinking water.',
    'glucose.descEmpty': 'Scan your first food to see your estimated glucose curve.',
    'glucose.peakEstimate': 'Estimated peak:',
    'glucose.peakAt': 'at',
    'glucose.peakMin': 'min.',
    'glucose.returnBase': 'Returns to baseline in ~',
    'glucose.returnHrs': 'hrs.',

    // Traffic light labels (food log)
    'tl.green': 'LOW',
    'tl.yellow': 'MED',
    'tl.red': 'HIGH',

    // Common
    'common.back': 'Back',
    'common.closeMenu': 'Close menu',
    'common.addFood': 'Add food',
    'common.aiMealIdeas': 'AI meal ideas',
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
