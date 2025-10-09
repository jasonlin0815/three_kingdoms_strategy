import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const DataManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">資料管理</h2>
          <p className="text-muted-foreground mt-1">
            CSV 數據上傳與管理
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          上傳 CSV
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>支援的檔案格式</CardTitle>
            <CardDescription>CSV File Format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">檔名格式：</p>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  同盟統計2025年10月09日10时13分09秒.csv
                </code>
              </div>
              <div>
                <p className="font-medium mb-1">必要欄位：</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>成員</li>
                  <li>貢獻排行、貢獻本週、貢獻總量</li>
                  <li>戰功本週、戰功總量</li>
                  <li>助攻本週、助攻總量</li>
                  <li>捐獻本週、捐獻總量</li>
                  <li>勢力值、所屬州、分組</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>上傳記錄</CardTitle>
            <CardDescription>Upload History</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                尚無上傳記錄
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DataManagement
