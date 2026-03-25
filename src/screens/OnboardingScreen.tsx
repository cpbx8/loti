import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext'
import WelcomeScreen from './onboarding/WelcomeScreen'
import HealthStateScreen from './onboarding/HealthStateScreen'
import DiagnosisScreen from './onboarding/DiagnosisScreen'
import A1CScreen from './onboarding/A1CScreen'
import MedicationsScreen from './onboarding/MedicationsScreen'
import AgeSexScreen from './onboarding/AgeSexScreen'
import ActivityScreen from './onboarding/ActivityScreen'
import DietaryScreen from './onboarding/DietaryScreen'
import SummaryScreen from './onboarding/SummaryScreen'

const SCREEN_COMPONENTS: Record<string, React.FC> = {
  welcome: WelcomeScreen,
  health_state: HealthStateScreen,
  diagnosis: DiagnosisScreen,
  a1c: A1CScreen,
  medications: MedicationsScreen,
  age_sex: AgeSexScreen,
  activity: ActivityScreen,
  dietary: DietaryScreen,
  summary: SummaryScreen,
}

function OnboardingRouter() {
  const { currentScreenDef } = useOnboarding()
  const Component = SCREEN_COMPONENTS[currentScreenDef.id]

  if (!Component) {
    return <div className="flex flex-1 items-center justify-center">Unknown screen: {currentScreenDef.id}</div>
  }

  return <Component />
}

export default function OnboardingScreen() {
  return (
    <OnboardingProvider>
      <OnboardingRouter />
    </OnboardingProvider>
  )
}
