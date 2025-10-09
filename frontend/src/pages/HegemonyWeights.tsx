import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const HegemonyWeights: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">霸業權重</h2>
        <p className="text-muted-foreground mt-1">
          自定義霸業評分權重配置
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>評分權重設定</CardTitle>
          <CardDescription>Configure scoring weights for different metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">貢獻權重</label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0.4"
                  defaultValue="0.4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">戰功權重</label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0.3"
                  defaultValue="0.3"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">助攻權重</label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0.2"
                  defaultValue="0.2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">捐獻權重</label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0.1"
                  defaultValue="0.1"
                />
              </div>
            </div>

            <div className="pt-4">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                儲存設定
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>權重說明</CardTitle>
          <CardDescription>Understanding weight calculation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              霸業評分 = 貢獻 × 貢獻權重 + 戰功 × 戰功權重 + 助攻 × 助攻權重 + 捐獻 × 捐獻權重
            </p>
            <p>
              所有權重總和應等於 1.0，系統會自動進行正規化處理。
            </p>
            <p>
              建議根據同盟的戰略目標調整各項指標的權重，以更準確地評估成員貢獻。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default HegemonyWeights
