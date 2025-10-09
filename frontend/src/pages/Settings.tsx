import { useAlliance } from '@/hooks/use-alliance'
import { AllianceForm } from '@/components/alliance/AllianceForm'
import { AllianceCollaboratorManager } from '@/components/alliance/AllianceCollaboratorManager'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const Settings: React.FC = () => {
  const { data: alliance } = useAlliance()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">設定</h2>
        <p className="text-muted-foreground mt-1">
          管理你的帳戶與同盟設定
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">同盟設定</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {alliance
              ? '更新你的同盟資訊，包含名稱與伺服器設定'
              : '請先設定同盟資訊以開始使用系統'
            }
          </p>
        </div>

        <div className="space-y-4">
          <AllianceForm />
          {alliance && <AllianceCollaboratorManager allianceId={alliance.id} />}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">帳戶設定</h3>
          <p className="text-sm text-muted-foreground mt-1">
            管理你的個人資訊與偏好設定
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>個人資料</CardTitle>
            <CardDescription>管理你的個人資訊</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                此功能即將推出
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Settings
