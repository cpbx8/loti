import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n'

const SECTIONS_EN = [
  { title: 'What We Collect', body: 'Loti collects the health profile information you provide during onboarding (health status, A1C, age, dietary restrictions) to personalize your glucose impact ratings. Food scan data is processed to provide nutritional analysis.' },
  { title: 'How We Use It', body: 'Your profile data is used solely to customize traffic light thresholds and AI food suggestions. Photos are sent to our analysis service and are not stored permanently. Your food log is stored locally on your device.' },
  { title: 'Data Storage', body: 'Most data is stored locally on your device using SQLite. When you scan food, photos are sent to our cloud service for AI analysis and immediately discarded after processing. We do not sell your data to third parties.' },
  { title: 'Third-Party Services', body: 'We use FatSecret Platform API and Open Food Facts for nutritional data, and OpenAI for photo analysis and food suggestions. These services may process data according to their own privacy policies.' },
  { title: 'Your Rights', body: 'You can delete all your data at any time through Settings > Clear All Data & Reset. This removes all locally stored data including your health profile, food log, and favorites.' },
  { title: 'Contact', body: 'For privacy concerns, contact us at privacy@loti.app.' },
]

const SECTIONS_ES = [
  { title: 'Qué Recopilamos', body: 'Loti recopila la información de perfil de salud que proporcionas durante el onboarding (estado de salud, A1C, edad, restricciones alimentarias) para personalizar tus calificaciones de impacto glucémico. Los datos de escaneo de alimentos se procesan para proporcionar análisis nutricional.' },
  { title: 'Cómo Lo Usamos', body: 'Tus datos de perfil se usan únicamente para personalizar los umbrales del semáforo y las sugerencias de alimentos con IA. Las fotos se envían a nuestro servicio de análisis y no se almacenan permanentemente. Tu registro de alimentos se guarda localmente en tu dispositivo.' },
  { title: 'Almacenamiento de Datos', body: 'La mayoría de los datos se almacenan localmente en tu dispositivo usando SQLite. Cuando escaneas comida, las fotos se envían a nuestro servicio en la nube para análisis con IA y se descartan inmediatamente después del procesamiento. No vendemos tus datos a terceros.' },
  { title: 'Servicios de Terceros', body: 'Usamos FatSecret Platform API y Open Food Facts para datos nutricionales, y OpenAI para análisis de fotos y sugerencias de alimentos. Estos servicios pueden procesar datos de acuerdo con sus propias políticas de privacidad.' },
  { title: 'Tus Derechos', body: 'Puedes eliminar todos tus datos en cualquier momento a través de Ajustes > Borrar datos y resetear. Esto elimina todos los datos almacenados localmente, incluyendo tu perfil de salud, registro de alimentos y favoritos.' },
  { title: 'Contacto', body: 'Para consultas de privacidad, contáctanos en privacy@loti.app.' },
]

export default function PrivacyScreen() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const sections = language === 'es' ? SECTIONS_ES : SECTIONS_EN

  return (
    <div className="flex flex-1 flex-col bg-surface min-h-screen">
      <header className="flex items-center gap-3 bg-card px-5 py-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-surface min-h-[44px] min-w-[44px]"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-title text-on-surface">{language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="prose prose-sm max-w-none text-text-secondary">
          <p className="text-xs text-text-tertiary mb-4">
            {language === 'es' ? 'Última actualización: marzo 2026' : 'Last updated: March 2026'}
          </p>
          {sections.map(s => (
            <div key={s.title}>
              <h2 className="text-base font-semibold text-text-primary mt-4 mb-2">{s.title}</h2>
              <p className="text-sm leading-relaxed mb-3">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
