import { MoreHorizontal, Eye, Pencil, Trash2, Mail, FileDown, Copy, GitMerge } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

interface RowActionsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onEmail?: () => void
  onPdf?: () => void
  onDuplicate?: () => void
  onMerge?: () => void
  viewLabel?: string
  editLabel?: string
  deleteLabel?: string
}

export function RowActions({ onView, onEdit, onDelete, onEmail, onPdf, onDuplicate, onMerge, viewLabel = 'View', editLabel = 'Edit', deleteLabel = 'Delete' }: RowActionsProps) {
  if (!onView && !onEdit && !onDelete && !onEmail && !onPdf && !onDuplicate && !onMerge) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Actions"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye size={14} className="mr-2" />{viewLabel}
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil size={14} className="mr-2" />{editLabel}
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy size={14} className="mr-2" />Duplicate
          </DropdownMenuItem>
        )}
        {(onView || onEdit || onDuplicate) && (onEmail || onPdf || onMerge || onDelete) && <DropdownMenuSeparator />}
        {onEmail && (
          <DropdownMenuItem onClick={onEmail}>
            <Mail size={14} className="mr-2" />Email
          </DropdownMenuItem>
        )}
        {onPdf && (
          <DropdownMenuItem onClick={onPdf}>
            <FileDown size={14} className="mr-2" />Download PDF
          </DropdownMenuItem>
        )}
        {onMerge && (
          <DropdownMenuItem onClick={onMerge}>
            <GitMerge size={14} className="mr-2" />Merge
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            {(onEmail || onPdf || onMerge) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 size={14} className="mr-2" />{deleteLabel}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
