import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase will automatically handle the OAuth callback
    // We just need to wait for the auth state to update and redirect
    const timer = setTimeout(() => {
      navigate('/')
    }, 1000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h2 className="mt-4 text-lg font-semibold">登入中...</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          請稍候，正在處理您的登入請求
        </p>
      </div>
    </div>
  )
}
