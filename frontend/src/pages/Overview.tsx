import { Link } from 'react-router-dom'
import { useAlliance } from '@/hooks/use-alliance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Settings } from 'lucide-react'

const Overview: React.FC = () => {
  const { data: alliance, isLoading } = useAlliance()

  // Show setup prompt if no alliance
  if (!isLoading && !alliance) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">總覽</h2>
          <p className="text-muted-foreground mt-1">
            盟友表現數據總覽
          </p>
        </div>

        {/* Setup Prompt Card */}
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 mt-1" />
              <div className="flex-1">
                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                  尚未設定同盟
                </CardTitle>
                <CardDescription className="text-yellow-800 dark:text-yellow-200 mt-2">
                  在開始使用系統功能之前，請先前往設定頁面建立你的同盟資訊
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link to="/settings">
              <Button className="gap-2">
                <Settings className="h-4 w-4" />
                前往設定
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>快速開始</CardTitle>
            <CardDescription>設定完成後，您可以：</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">📊 1. 上傳 CSV 數據</h3>
                <p className="text-sm text-muted-foreground">
                  上傳三國志戰略版的盟友表現 CSV 檔案
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">📈 2. 查看分析報表</h3>
                <p className="text-sm text-muted-foreground">
                  自動生成成員表現趨勢與統計數據
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🎯 3. 管理成員表現</h3>
                <p className="text-sm text-muted-foreground">
                  追蹤個別成員的貢獻與活躍度
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">總覽</h2>
        <p className="text-muted-foreground mt-1">
          盟友表現數據總覽
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>總成員數</CardTitle>
            <CardDescription>Total Members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">0</div>
            <p className="text-sm text-muted-foreground mt-2">
              尚未上傳數據
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本週貢獻</CardTitle>
            <CardDescription>Weekly Contribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">0</div>
            <p className="text-sm text-muted-foreground mt-2">
              等待數據上傳
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>活躍成員</CardTitle>
            <CardDescription>Active Members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">0</div>
            <p className="text-sm text-muted-foreground mt-2">
              本週活躍統計
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快速開始</CardTitle>
          <CardDescription>Get Started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📊 1. 上傳 CSV 數據</h3>
              <p className="text-sm text-muted-foreground">
                上傳三國志戰略版的盟友表現 CSV 檔案
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📈 2. 查看分析報表</h3>
              <p className="text-sm text-muted-foreground">
                自動生成成員表現趨勢與統計數據
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎯 3. 管理成員表現</h3>
              <p className="text-sm text-muted-foreground">
                追蹤個別成員的貢獻與活躍度
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Overview
