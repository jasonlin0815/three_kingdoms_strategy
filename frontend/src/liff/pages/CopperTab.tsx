/**
 * Copper Tab
 *
 * Compact copper mine registration for LIFF Tall mode.
 */

import { useState } from 'react'
import { Plus, MapPin, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useLiffCopperMines,
  useLiffCopperRules,
  useLiffRegisterCopper,
  useLiffDeleteCopper,
} from '../hooks/use-liff-copper'
import { useLiffMemberInfo } from '../hooks/use-liff-member'
import type { LiffSession } from '../hooks/use-liff-session'

interface Props {
  readonly session: LiffSession
}

export function CopperTab({ session }: Props) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [coordX, setCoordX] = useState('')
  const [coordY, setCoordY] = useState('')
  const [level, setLevel] = useState('9')
  const [formError, setFormError] = useState('')

  const context = {
    lineUserId: session.lineUserId,
    lineGroupId: session.lineGroupId!,
  }

  const memberContext = {
    ...context,
    lineDisplayName: session.lineDisplayName,
  }

  // Get registered accounts
  const { data: memberInfo, isLoading: isLoadingMember } = useLiffMemberInfo(memberContext)
  const accounts = memberInfo?.registered_ids || []
  const effectiveGameId = selectedGameId || accounts[0]?.game_id || null

  const { data, isLoading, error } = useLiffCopperMines(context)
  const { data: rules } = useLiffCopperRules(session.lineGroupId)
  const registerMutation = useLiffRegisterCopper(context)
  const deleteMutation = useLiffDeleteCopper(context)

  const handleRegister = async () => {
    if (!effectiveGameId || !coordX.trim() || !coordY.trim()) return

    const x = parseInt(coordX, 10)
    const y = parseInt(coordY, 10)

    if (isNaN(x) || x < 0) {
      setFormError('X 座標格式錯誤')
      return
    }
    if (isNaN(y) || y < 0) {
      setFormError('Y 座標格式錯誤')
      return
    }

    setFormError('')
    try {
      await registerMutation.mutateAsync({
        gameId: effectiveGameId,
        coordX: x,
        coordY: y,
        level: parseInt(level, 10),
      })
      setCoordX('')
      setCoordY('')
    } catch {
      // Error handled by mutation
    }
  }

  const handleDelete = async (mineId: string) => {
    if (!confirm('確定刪除？')) return
    await deleteMutation.mutateAsync({ mineId })
  }

  if (isLoadingMember || isLoading) {
    return (
      <div className="py-6 text-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
      </div>
    )
  }

  // No registered accounts - prompt to register first
  if (accounts.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          請先至「遊戲 ID」頁面註冊帳號
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 text-center text-sm text-destructive">
        {error.message}
      </div>
    )
  }

  const mines = data?.mines || []

  // 判斷銅礦是否為自己註冊的（根據 game_id 匹配用戶的帳號列表）
  const myGameIds = new Set(accounts.map((acc) => acc.game_id))
  const isMyMine = (gameId: string) => myGameIds.has(gameId)

  // Format level text for display
  const formatLevel = (allowedLevel: 'nine' | 'ten' | 'both') => {
    if (allowedLevel === 'nine') return '9 級'
    if (allowedLevel === 'ten') return '10 級'
    return '9/10 級'
  }

  // Format merit number with comma separators
  const formatMerit = (merit: number) => merit.toLocaleString('zh-TW')

  return (
    <div className="p-3 space-y-3">
      {/* Compact form */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Account selector */}
          {accounts.length === 1 ? (
            <div className="h-10 flex-1 flex items-center px-3 bg-muted/50 rounded-md text-sm">
              {effectiveGameId}
            </div>
          ) : (
            <Select
              value={effectiveGameId || ''}
              onValueChange={setSelectedGameId}
            >
              <SelectTrigger className="h-10 flex-1">
                <SelectValue placeholder="選擇帳號" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.game_id} value={acc.game_id}>
                    {acc.game_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="h-10 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 級</SelectItem>
              <SelectItem value="9">9 級</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-sm text-muted-foreground shrink-0">X</span>
            <Input
              value={coordX}
              onChange={(e) => setCoordX(e.target.value)}
              placeholder="123"
              className="h-10"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-sm text-muted-foreground shrink-0">Y</span>
            <Input
              value={coordY}
              onChange={(e) => setCoordY(e.target.value)}
              placeholder="456"
              className="h-10"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            />
          </div>
          <Button
            onClick={handleRegister}
            disabled={!effectiveGameId || !coordX.trim() || !coordY.trim() || registerMutation.isPending}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {registerMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {(formError || registerMutation.error) && (
        <p className="text-xs text-destructive">
          {formError || registerMutation.error?.message}
        </p>
      )}

      {/* Rules display */}
      {rules && rules.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Info className="h-3.5 w-3.5" />
            申請條件
          </div>
          <div className="grid gap-1">
            {rules.map((rule) => (
              <div key={rule.tier} className="flex justify-between text-xs">
                <span>第 {rule.tier} 座</span>
                <span>
                  {formatLevel(rule.allowed_level)} · 戰功 ≥ {formatMerit(rule.required_merit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mines list */}
      <div className="pt-2">
        <div className="text-xs text-muted-foreground mb-2">
          同盟銅礦 ({mines.length})
        </div>
        {mines.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            尚未有銅礦記錄
          </p>
        ) : (
          <div className="space-y-1">
            {mines.map((mine) => {
              const isMine = isMyMine(mine.game_id)
              return (
                <div
                  key={mine.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    isMine ? 'bg-primary/10' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className={`h-3.5 w-3.5 shrink-0 ${isMine ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Lv.{mine.level}</span>
                    <span className="text-xs text-muted-foreground">
                      ({mine.coord_x},{mine.coord_y})
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {mine.game_id}
                    </span>
                  </div>
                  {/* 只有自己的銅礦才顯示刪除按鈕 */}
                  {isMine && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDelete(mine.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
