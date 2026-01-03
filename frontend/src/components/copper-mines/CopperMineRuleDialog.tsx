/**
 * CopperMineRuleDialog - Dialog for creating/editing copper mine rules
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateCopperMineRule,
  useUpdateCopperMineRule,
} from '@/hooks/use-copper-mines'
import type { CopperMineRule, AllowedLevel } from '@/types/copper-mine'

interface FormData {
  required_merit: string
  allowed_level: AllowedLevel
}

interface CopperMineRuleDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly allianceId: string
  readonly editingRule: CopperMineRule | null
  readonly existingRules: readonly CopperMineRule[]
  readonly nextTier: number
}

export function CopperMineRuleDialog({
  open,
  onOpenChange,
  allianceId,
  editingRule,
  existingRules,
  nextTier,
}: CopperMineRuleDialogProps) {
  const createMutation = useCreateCopperMineRule()
  const updateMutation = useUpdateCopperMineRule()
  const isEditing = !!editingRule

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      required_merit: '',
      allowed_level: 'both',
    },
  })

  const allowedLevel = watch('allowed_level')

  // Reset form when dialog opens/closes or editing rule changes
  useEffect(() => {
    if (open) {
      if (editingRule) {
        reset({
          required_merit: editingRule.required_merit.toString(),
          allowed_level: editingRule.allowed_level,
        })
      } else {
        reset({
          required_merit: '',
          allowed_level: 'both',
        })
      }
    }
  }, [open, editingRule, reset])

  // Get min merit based on previous tier
  function getMinMerit(): number {
    if (isEditing) {
      const prevTier = existingRules.find((r) => r.tier === editingRule.tier - 1)
      return prevTier ? prevTier.required_merit + 1 : 1
    }
    const prevTier = existingRules.find((r) => r.tier === nextTier - 1)
    return prevTier ? prevTier.required_merit + 1 : 1
  }

  async function onSubmit(data: FormData) {
    const meritValue = parseInt(data.required_merit, 10)

    if (isEditing) {
      await updateMutation.mutateAsync({
        ruleId: editingRule.id,
        allianceId,
        data: {
          required_merit: meritValue,
          allowed_level: data.allowed_level,
        },
      })
    } else {
      await createMutation.mutateAsync({
        allianceId,
        data: {
          tier: nextTier,
          required_merit: meritValue,
          allowed_level: data.allowed_level,
        },
      })
    }

    onOpenChange(false)
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const minMerit = getMinMerit()
  const currentTier = isEditing ? editingRule.tier : nextTier

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `編輯第 ${currentTier} 座規則` : `新增第 ${currentTier} 座規則`}
          </DialogTitle>
          <DialogDescription>
            設定申請第 {currentTier} 座銅礦所需的總戰功門檻
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="required_merit">總戰功門檻</Label>
            <Input
              id="required_merit"
              type="number"
              placeholder={`最少 ${minMerit.toLocaleString()}`}
              {...register('required_merit', {
                required: '請輸入戰功門檻',
                min: {
                  value: minMerit,
                  message: `必須大於前一階梯 (${minMerit.toLocaleString()})`,
                },
              })}
            />
            {errors.required_merit && (
              <p className="text-sm text-destructive">{errors.required_merit.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowed_level">可申請等級</Label>
            <Select
              value={allowedLevel}
              onValueChange={(value: AllowedLevel) => setValue('allowed_level', value)}
            >
              <SelectTrigger id="allowed_level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">9 或 10 級</SelectItem>
                <SelectItem value="nine">僅 9 級</SelectItem>
                <SelectItem value="ten">僅 10 級</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? '儲存' : '新增'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
