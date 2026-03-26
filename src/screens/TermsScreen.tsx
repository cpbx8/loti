import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n'

const SECTIONS_EN = [
  { title: 'Acceptance', body: 'By using Loti, you agree to these terms. If you do not agree, please do not use the app.' },
  { title: 'Medical Disclaimer', body: 'Loti AI is intended for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek advice from your healthcare provider before making any changes to your diabetes management or treatment plan. Nutritional values and glycemic impact ratings are estimates and may not be accurate for all individuals.' },
  { title: 'Use of Service', body: 'You may use Loti for personal, non-commercial purposes. You are responsible for maintaining the security of your device. Do not use the service to process data for others without their consent.' },
  { title: 'AI-Generated Content', body: 'Food suggestions, nutritional estimates, and glycemic impact ratings are generated using AI and third-party databases. These are approximations and should not be relied upon as medical guidance. Individual responses to food vary significantly.' },
  { title: 'Subscriptions', body: 'Loti offers a free trial and paid subscription plans. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. You can manage subscriptions through your device settings.' },
  { title: 'Limitation of Liability', body: 'Loti and its creators are not liable for any health outcomes resulting from use of the app. You use Loti at your own risk. We do not guarantee the accuracy of nutritional data or AI recommendations.' },
  { title: 'Changes', body: 'We may update these terms at any time. Continued use of Loti after changes constitutes acceptance of the updated terms.' },
  { title: 'Contact', body: 'Questions about these terms? Contact us at support@loti.app.' },
]

const SECTIONS_ES = [
  { title: 'Aceptación', body: 'Al usar Loti, aceptas estos términos. Si no estás de acuerdo, por favor no uses la aplicación.' },
  { title: 'Aviso Médico', body: 'Loti AI es solo para fines informativos. No sustituye el consejo médico profesional, diagnóstico o tratamiento. Siempre consulta a tu médico antes de hacer cambios en tu plan de manejo de diabetes. Los valores nutricionales y las calificaciones de impacto glucémico son estimaciones y pueden no ser precisos para todas las personas.' },
  { title: 'Uso del Servicio', body: 'Puedes usar Loti para fines personales y no comerciales. Eres responsable de mantener la seguridad de tu dispositivo. No uses el servicio para procesar datos de otros sin su consentimiento.' },
  { title: 'Contenido Generado por IA', body: 'Las sugerencias de alimentos, estimaciones nutricionales y calificaciones de impacto glucémico se generan usando IA y bases de datos de terceros. Son aproximaciones y no deben considerarse como guía médica. Las respuestas individuales a los alimentos varían significativamente.' },
  { title: 'Suscripciones', body: 'Loti ofrece una prueba gratuita y planes de suscripción de pago. Las suscripciones se renuevan automáticamente a menos que se cancelen al menos 24 horas antes del final del período actual. Puedes gestionar las suscripciones a través de los ajustes de tu dispositivo.' },
  { title: 'Limitación de Responsabilidad', body: 'Loti y sus creadores no son responsables de ningún resultado de salud derivado del uso de la aplicación. Usas Loti bajo tu propio riesgo. No garantizamos la precisión de los datos nutricionales ni las recomendaciones de IA.' },
  { title: 'Cambios', body: 'Podemos actualizar estos términos en cualquier momento. El uso continuado de Loti después de los cambios constituye la aceptación de los términos actualizados.' },
  { title: 'Contacto', body: '¿Preguntas sobre estos términos? Contáctanos en support@loti.app.' },
]

export default function TermsScreen() {
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
        <h1 className="text-title text-on-surface">{language === 'es' ? 'Términos de Servicio' : 'Terms of Service'}</h1>
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
