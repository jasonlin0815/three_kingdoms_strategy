import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const MemberPerformance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">成員表現</h2>
          <p className="text-muted-foreground mt-1">
            查看個別成員的詳細表現數據
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-64"
            placeholder="搜尋成員..."
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>成員列表</CardTitle>
          <CardDescription>Member Performance List</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              尚無成員數據
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              請先上傳 CSV 資料以查看成員表現統計。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MemberPerformance
