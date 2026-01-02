/**
 * Copper Tab
 *
 * Compact copper mine registration for LIFF Tall mode.
 */

import { useState } from 'react'
import { Plus, MapPin, Trash2 } from 'lucide-react'
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
  useLiffRegisterCopper,
  useLiffDeleteCopper,
} from '../hooks/use-liff-copper'
import type { LiffSession } from '../hooks/use-liff-session'

interface Props {
  readonly session: LiffSession
}

function parseCoordinate(coord: string): { x: number; y: number } | null {
  const match = coord.match(/^(\d+)[,，\s]+(\d+)$/)
  if (!match) return null
  return { x: parseInt(match[1], 10), y: parseInt(match[2], 10) }
}

export function CopperTab({ session }: Props) {
  const [gameId, setGameId] = useState('')
  const [coordinate, setCoordinate] = useState('')
  const [level, setLevel] = useState('9')
  const [formError, setFormError] = useState('')

  const context = {
    lineUserId: session.lineUserId,
    lineGroupId: session.lineGroupId!,
  }

  const { data, isLoading, error } = useLiffCopperMines(context)
  const registerMutation = useLiffRegisterCopper(context)
  const deleteMutation = useLiffDeleteCopper(context)

  const handleRegister = async () => {
    if (!gameId.trim() || !coordinate.trim()) return

    const parsed = parseCoordinate(coordinate)
    if (!parsed) {
      setFormError('座標格式錯誤')
      return
    }

    setFormError('')
    try {
      await registerMutation.mutateAsync({
        gameId: gameId.trim(),
        coordX: parsed.x,
        coordY: parsed.y,
        level: parseInt(level, 10),
      })
      setGameId('')
      setCoordinate('')
    } catch {
      // Error handled by mutation
    }
  }

  const handleDelete = async (mineId: string) => {
    if (!confirm('確定刪除？')) return
    await deleteMutation.mutateAsync({ mineId })
  }

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
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

  return (
    <div className="p-3 space-y-3">
      {/* Compact form */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="遊戲 ID"
            className="h-10 flex-1"
          />
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="h-10 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...Array(10)].map((_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {i + 1} 級
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input
            value={coordinate}
            onChange={(e) => setCoordinate(e.target.value)}
            placeholder="座標 123,456"
            className="h-10 flex-1"
            inputMode="numeric"
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          />
          <Button
            onClick={handleRegister}
            disabled={!gameId.trim() || !coordinate.trim() || registerMutation.isPending}
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

      {/* Mines list */}
      <div className="pt-2">
        <div className="text-xs text-muted-foreground mb-2">
          已註冊 ({mines.length})
        </div>
        {mines.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            尚未註冊銅礦
          </p>
        ) : (
          <div className="space-y-1">
            {mines.map((mine) => (
              <div
                key={mine.id}
                className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium">Lv.{mine.level}</span>
                  <span className="text-xs text-muted-foreground">
                    ({mine.coord_x},{mine.coord_y})
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {mine.game_id}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleDelete(mine.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
