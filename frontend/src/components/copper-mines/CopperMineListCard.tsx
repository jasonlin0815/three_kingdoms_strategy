/**
 * CopperMineListCard - Copper mine ownership list for current season
 *
 * Displays all copper mine records with filtering by group.
 * Collaborators can add/delete records, all members can view.
 */

import { useState, useMemo } from 'react'
import { Plus, Trash2, Loader2, Map, Filter } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { CopperMineFormDialog } from './CopperMineFormDialog'
import {
  useCopperMineOwnerships,
  useDeleteCopperMineOwnership,
} from '@/hooks/use-copper-mines'
import { useCanManageWeights } from '@/hooks/use-user-role'
import type { CopperMineOwnership } from '@/types/copper-mine'

interface CopperMineListCardProps {
  readonly seasonId: string
  readonly seasonName: string
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
}

function formatCoord(x: number, y: number): string {
  return `(${x}, ${y})`
}

export function CopperMineListCard({ seasonId, seasonName }: CopperMineListCardProps) {
  const canManage = useCanManageWeights()
  const { data: ownerships, isLoading } = useCopperMineOwnerships(seasonId)
  const deleteMutation = useDeleteCopperMineOwnership()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingOwnership, setDeletingOwnership] = useState<CopperMineOwnership | null>(null)
  const [groupFilter, setGroupFilter] = useState<string>('all')

  // Extract unique groups for filter dropdown
  const groups = useMemo(() => {
    if (!ownerships) return []
    const uniqueGroups = new Set(
      ownerships.map((o) => o.member_group).filter((g): g is string => g !== null)
    )
    return Array.from(uniqueGroups).sort()
  }, [ownerships])

  // Filter and sort ownerships
  const filteredOwnerships = useMemo(() => {
    if (!ownerships) return []
    let result = [...ownerships]

    // Apply group filter
    if (groupFilter !== 'all') {
      result = result.filter((o) => o.member_group === groupFilter)
    }

    // Sort by applied_at descending (newest first)
    result.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())

    return result
  }, [ownerships, groupFilter])

  function handleDeleteClick(ownership: CopperMineOwnership) {
    setDeletingOwnership(ownership)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deletingOwnership) return
    await deleteMutation.mutateAsync({
      ownershipId: deletingOwnership.id,
      seasonId,
    })
    setDeleteDialogOpen(false)
    setDeletingOwnership(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">銅礦擁有列表</CardTitle>
                <CardDescription>
                  {seasonName} - 共 {ownerships?.length ?? 0} 座銅礦
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Group Filter */}
              {groups.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="篩選組別" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部組別</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Add Button */}
              {canManage && (
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOwnerships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {groupFilter !== 'all' ? (
                <p>該組別沒有銅礦記錄</p>
              ) : (
                <>
                  <p>尚無銅礦記錄</p>
                  {canManage && <p className="text-sm mt-1">點擊「新增」開始登記</p>}
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">座標</TableHead>
                    <TableHead>遊戲 ID</TableHead>
                    <TableHead>LINE 名稱</TableHead>
                    <TableHead className="w-20">等級</TableHead>
                    <TableHead className="w-20">組別</TableHead>
                    <TableHead className="w-24">申請日期</TableHead>
                    {canManage && <TableHead className="w-16 text-right">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwnerships.map((ownership) => (
                    <TableRow key={ownership.id}>
                      <TableCell className="font-mono text-sm">
                        {formatCoord(ownership.coord_x, ownership.coord_y)}
                      </TableCell>
                      <TableCell className="font-medium">{ownership.member_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ownership.line_display_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ownership.level === 10 ? 'default' : 'secondary'}>
                          {ownership.level} 級
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ownership.member_group ? (
                          <Badge variant="outline">{ownership.member_group}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(ownership.applied_at)}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(ownership)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <CopperMineFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        seasonId={seasonId}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="刪除銅礦記錄"
        description={
          deletingOwnership
            ? `確定要刪除 ${deletingOwnership.member_name} 位於 ${formatCoord(deletingOwnership.coord_x, deletingOwnership.coord_y)} 的銅礦記錄嗎？`
            : ''
        }
        isDeleting={deleteMutation.isPending}
      />
    </>
  )
}
