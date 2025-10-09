import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const Seasons: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">賽季管理</h2>
          <p className="text-muted-foreground mt-1">
            管理遊戲賽季與數據週期
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          建立賽季
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>賽季列表</CardTitle>
          <CardDescription>目前沒有賽季資料</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              尚未建立任何賽季
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              建立第一個賽季以開始追蹤盟友表現數據。每個賽季可以設定時間範圍，方便進行數據分析與比較。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Seasons
