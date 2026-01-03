/**
 * CopperMineRulesCard - Copper mine application rules configuration
 *
 * Displays and manages copper mine tier rules (alliance level).
 * Collaborators can add/edit/delete rules, members can only view.
 */

import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Settings2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { CopperMineRuleDialog } from './CopperMineRuleDialog'
import {
  useCopperMineRules,
  useDeleteCopperMineRule,
} from '@/hooks/use-copper-mines'
import { useCanManageWeights } from '@/hooks/use-user-role'
import type { CopperMineRule, AllowedLevel } from '@/types/copper-mine'
import { ALLOWED_LEVEL_LABELS } from '@/types/copper-mine'

interface CopperMineRulesCardProps {
  readonly allianceId: string
}

function formatMerit(value: number): string {
  return value.toLocaleString('zh-TW')
}

function getAllowedLevelBadgeVariant(level: AllowedLevel): 'default' | 'secondary' | 'outline' {
  switch (level) {
    case 'ten':
      return 'default'
    case 'nine':
      return 'secondary'
    case 'both':
      return 'outline'
  }
}

export function CopperMineRulesCard({ allianceId }: CopperMineRulesCardProps) {
  const canManage = useCanManageWeights()
  const { data: rules, isLoading } = useCopperMineRules(allianceId)
  const deleteMutation = useDeleteCopperMineRule()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CopperMineRule | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRule, setDeletingRule] = useState<CopperMineRule | null>(null)

  const sortedRules = rules ? [...rules].sort((a, b) => a.tier - b.tier) : []
  const nextTier = sortedRules.length > 0 ? sortedRules[sortedRules.length - 1].tier + 1 : 1
  const canAddMore = nextTier <= 10

  function handleAdd() {
    setEditingRule(null)
    setDialogOpen(true)
  }

  function handleEdit(rule: CopperMineRule) {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  function handleDeleteClick(rule: CopperMineRule) {
    setDeletingRule(rule)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deletingRule) return
    await deleteMutation.mutateAsync({
      ruleId: deletingRule.id,
      allianceId,
    })
    setDeleteDialogOpen(false)
    setDeletingRule(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">申請規則設置</CardTitle>
                <CardDescription>
                  設定銅礦申請的戰功門檻與可申請等級
                </CardDescription>
              </div>
            </div>
            {canManage && canAddMore && (
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" />
                新增階梯
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>尚未設定任何申請規則</p>
              {canManage && (
                <p className="text-sm mt-1">點擊「新增階梯」開始設定</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">座數</TableHead>
                  <TableHead>總戰功門檻</TableHead>
                  <TableHead>可申請等級</TableHead>
                  {canManage && <TableHead className="w-24 text-right">操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">第 {rule.tier} 座</TableCell>
                    <TableCell className="font-mono">
                      {formatMerit(rule.required_merit)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAllowedLevelBadgeVariant(rule.allowed_level)}>
                        {ALLOWED_LEVEL_LABELS[rule.allowed_level]}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(rule)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!canManage && sortedRules.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4">
              僅協作者以上可編輯規則設置
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rule Dialog */}
      <CopperMineRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        allianceId={allianceId}
        editingRule={editingRule}
        existingRules={sortedRules}
        nextTier={nextTier}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="刪除申請規則"
        description={`確定要刪除第 ${deletingRule?.tier} 座的申請規則嗎？此操作無法復原。`}
        isDeleting={deleteMutation.isPending}
      />
    </>
  )
}
