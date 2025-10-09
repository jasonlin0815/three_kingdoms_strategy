import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, TrendingUp, Users, BarChart3 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
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
    icon: TrendingUp,
    title: '戰功追蹤',
    description: '即時追蹤成員戰功表現'
  },
  {
    icon: BarChart3,
    title: '數據分析',
    description: '多維度指標統計分析'
  },
  {
    icon: Users,
    title: '成員管理',
    description: '完整生命週期追蹤'
  },
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
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 flex-shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="三國志戰略版"
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">三國志戰略版</span>
              <span className="text-xs text-muted-foreground leading-tight">同盟管理中心</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">

          {/* Left: Hero Content */}
          <div className="space-y-12">
            <div className="space-y-8">
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight">
                同盟管理中心
                <br />
                <span className="text-primary">數據驅動決策</span>
              </h1>
              <p className="text-2xl text-muted-foreground leading-relaxed max-w-xl">
                官員專屬的數據管理平台
                <br />
                透過 CSV 即時追蹤成員表現
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-10 pt-6">
              <div className="space-y-3">
                <div className="text-5xl font-bold text-primary whitespace-nowrap">5 分鐘</div>
                <p className="text-lg text-muted-foreground whitespace-nowrap">快速上手</p>
              </div>
              <div className="space-y-3">
                <div className="text-5xl font-bold text-primary whitespace-nowrap">13 項</div>
                <p className="text-lg text-muted-foreground whitespace-nowrap">核心指標</p>
              </div>
              <div className="space-y-3">
                <div className="text-5xl font-bold text-primary whitespace-nowrap">即時</div>
                <p className="text-lg text-muted-foreground whitespace-nowrap">數據更新</p>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-xl shadow-2xl border-2">
              <CardHeader className="space-y-4 pb-10">
                <CardTitle className="text-4xl text-center font-bold">開始使用</CardTitle>
                <CardDescription className="text-center text-lg">
                  使用 Google 帳戶登入系統
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 pb-10">
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
                  className="w-full h-16 text-xl font-medium"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'google' ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      登入中...
                    </>
                  ) : (
                    <>
                      <span className="mr-3">{GOOGLE_ICON}</span>
                      使用 Google 帳戶登入
                    </>
                  )}
                </Button>

                <p className="text-base text-center text-muted-foreground leading-relaxed pt-2">
                  登入即表示您同意我們的服務條款和隱私政策
                </p>
              </CardContent>
            </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-3xl font-bold">核心功能</h2>
            <p className="text-muted-foreground text-lg">
              為同盟幹部打造的管理工具
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="text-center border-2 hover:border-primary/50 hover:shadow-lg transition-all">
                  <CardHeader className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl whitespace-nowrap">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 bg-background flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="三國志戰略版"
                className="h-8 w-8 object-contain"
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                © 2025 三國志戰略版同盟管理中心
              </p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Version 0.1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
