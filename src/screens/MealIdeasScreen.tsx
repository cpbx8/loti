/**
 * MealIdeasScreen — full-screen wrapper for SuggestionSheet.
 * Navigated from the scan menu's "Meal ideas" button.
 */
import { useNavigate } from 'react-router-dom'
import SuggestionSheet from '@/components/SuggestionSheet'

export default function MealIdeasScreen() {
  const navigate = useNavigate()
  return <SuggestionSheet open={true} onClose={() => navigate('/')} />
}
