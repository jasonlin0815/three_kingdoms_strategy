import { useState } from 'react'
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { MemberListItem } from '@/types/analytics'

interface MemberComboboxProps {
  readonly members: MemberListItem[]
  readonly value: string | undefined
  readonly onValueChange: (value: string | undefined) => void
  readonly disabled?: boolean
  readonly isLoading?: boolean
  readonly placeholder?: string
  readonly className?: string
}

export function MemberCombobox({
  members,
  value,
  onValueChange,
  disabled = false,
  isLoading = false,
  placeholder = '選擇成員',
  className,
}: MemberComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedMember = members.find((m) => m.id === value)

  // Filter members based on search query
  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const nameMatch = member.name.toLowerCase().includes(query)
    const rankMatch = member.contribution_rank?.toString().includes(query)
    return nameMatch || rankMatch
  })

  const handleSelect = (memberId: string) => {
    onValueChange(memberId === value ? undefined : memberId)
    setOpen(false)
    setSearchQuery('')
  }

  const formatMemberLabel = (member: MemberListItem) => {
    const rankPrefix = member.contribution_rank ? `#${member.contribution_rank} ` : ''
    return `${rankPrefix}${member.name}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn('w-[220px] justify-between font-normal', className)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              載入中...
            </>
          ) : selectedMember ? (
            <span className="truncate">{formatMemberLabel(selectedMember)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="搜尋成員..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-1 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>找不到符合的成員</span>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === member.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{formatMemberLabel(member)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
