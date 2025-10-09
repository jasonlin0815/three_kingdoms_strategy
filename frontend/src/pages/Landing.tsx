import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Shield, Users, TrendingUp, BarChart3 } from 'lucide-react'
import type { Provider } from '@supabase/supabase-js'

const GOOGLE_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC04"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const FEATURES = [
  {
    icon: Users,
    title: '盟友管理',
    description: '追蹤同盟成員的各項表現數據'
  },
  {
    icon: BarChart3,
    title: '數據分析',
    description: '自動計算貢獻、戰功、助攻等指標'
  },
  {
    icon: TrendingUp,
    title: '趨勢追蹤',
    description: '完整的歷史數據與趨勢分析'
  },
  {
    icon: Shield,
    title: '安全可靠',
    description: '資料加密保護，僅您可存取'
  }
]

export function Landing() {
  const [isLoading, setIsLoading] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { signInWithOAuth } = useAuth()

  const handleOAuthLogin = async (provider: Provider) => {
    try {
      setIsLoading(provider)
      setError(null)
      await signInWithOAuth(provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">

      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">三國志戰略版</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Hero Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                盟友表現
                <br />
                <span className="text-primary">一目了然</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                三國志戰略版盟友管理系統，幫助盟主/官員輕鬆追蹤成員表現，
                透過 CSV 上傳實現自動化數據分析。
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary">3 分鐘</div>
                <p className="text-sm text-muted-foreground">快速設定</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">5 指標</div>
                <p className="text-sm text-muted-foreground">表現追蹤</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">100%</div>
                <p className="text-sm text-muted-foreground">資料安全</p>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl text-center">開始使用</CardTitle>
                <CardDescription className="text-center">
                  使用 Google 帳戶快速登入
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-sm text-destructive font-medium">登入失敗</p>
                    <p className="text-xs text-destructive/80 mt-1">{error}</p>
                  </div>
                )}

                {/* Google OAuth Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-medium shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'google' ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      登入中...
                    </>
                  ) : (
                    <>
                      <span className="mr-3">{GOOGLE_ICON}</span>
                      使用 Google 帳戶登入
                    </>
                  )}
                </Button>

                {/* Terms */}
                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                  登入即表示您同意我們的
                  <a href="#" className="underline hover:text-primary transition-colors">
                    服務條款
                  </a>
                  和
                  <a href="#" className="underline hover:text-primary transition-colors">
                    隱私政策
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">核心功能</h3>
            <p className="text-muted-foreground">
              專為三國志戰略版盟主打造的管理工具
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <p className="text-sm text-muted-foreground">
                © 2025 三國志戰略版管理系統
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                關於我們
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                使用說明
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                聯絡我們
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
