import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthForm from '@/components/Auth/AuthForm'

export default function AuthScreen() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">Loti</h1>
      <p className="mb-8 text-gray-500">Track your food. Know your glucose impact.</p>
      <AuthForm />
    </div>
  )
}
