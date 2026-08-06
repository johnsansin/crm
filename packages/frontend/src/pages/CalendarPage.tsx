import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, CalendarPlus, Pencil, Trash2, Loader2, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useOrgSettings, formatDate, formatTime, monthNames, weekDayNames,
  orderedWeekDayNames, firstDayOffset, isWorkingDay, workingHourRange, weekdayShort,
} from '@/lib/org-format'
import { t } from '@/lib/i18n'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const TYPE_STYLE: Record<string, { dot: string; chip: string }> = {
  Task: { dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 border-sky-400 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500' },
  Call: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500' },
  Meeting: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 border-violet-400 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500' },
  Other: { dot: 'bg-slate-500', chip: 'bg-slate-100 text-slate-600 border-slate-400 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500' },
}

const TASK_STATUS = ['Planned', 'In Progress', 'Completed', 'Deferred']
const EVENT_STATUS = ['Planned', 'Held', 'Not Held']
const PRIORITIES = ['High', 'Medium', 'Low']

type View = 'month' | 'week' | 'day' | 'list' | 'year'

function pad(n: number) { return String(n).padStart(2, '0') }

function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function shiftToDate(iso: string, target: Date): string {
  const d = new Date(iso)
  const t = new Date(target)
  t.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), 0)
  return t.toISOString()
}

function activityDay(a: any): Date {
  return a.startAt ? new Date(a.startAt) : a.dueAt ? new Date(a.dueAt) : new Date(a.createdAt)
}

function timeLabel(d: Date) {
  return formatTime(d)
}

function getRange(view: View, anchor: Date): { from: string; to: string } {
  if (view === 'month') {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const start = new Date(first)
    start.setDate(first.getDate() - firstDayOffset(first))
    const end = new Date(start)
    end.setDate(start.getDate() + 41)
    end.setHours(23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (view === 'week') {
    const day = new Date(anchor)
    const start = new Date(day)
    start.setDate(day.getDate() - firstDayOffset(day))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (view === 'year') {
    const start = new Date(anchor.getFullYear(), 0, 1)
    const end = new Date(anchor.getFullYear(), 11, 31)
    end.setHours(23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (view === 'list') {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  const start = new Date(anchor)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

function emptyForm(preset: { type: string; date: Date } | null) {
  if (preset) {
    const base = preset.date
    const nine = new Date(base); nine.setHours(9, 0, 0, 0)
    const ten = new Date(base); ten.setHours(10, 0, 0, 0)
    return preset.type === 'Task'
      ? { subject: '', activityType: 'Task', status: 'Planned', priority: 'Medium', location: '', startAt: '', endAt: '', dueAt: toLocalInput(nine), description: '' }
      : { subject: '', activityType: preset.type, status: 'Planned', priority: 'Medium', location: '', startAt: toLocalInput(nine), endAt: toLocalInput(ten), dueAt: '', description: '' }
  }
  return { subject: '', activityType: 'Task', status: 'Planned', priority: 'Medium', location: '', startAt: '', endAt: '', dueAt: '', description: '' }
}

export function CalendarPage() {
  const [view, setView] = useState<View>('month')
  const [anchor, setAnchor] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [preset, setPreset] = useState<{ type: string; date: Date } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  useOrgSettings()

  const range = useMemo(() => getRange(view, anchor), [view, anchor])

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', range.from, range.to],
    queryFn: () => api.getCalendar(range.from, range.to),
  })

  const activities = data?.data || []

  const mutateDelete = useMutation({
    mutationFn: (id: string) => api.deleteCalendarActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['activities-upcoming'] })
      addToast({ title: 'Activity deleted', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const mutateMove = useMutation({
    mutationFn: ({ id, date }: { id: string; date: Date }) => {
      const a = activities.find(x => x.id === id)
      const payload: any = {}
      if (a && a.activityType === 'Task' && a.dueAt) payload.dueAt = shiftToDate(a.dueAt, date)
      else {
        if (a?.startAt) payload.startAt = shiftToDate(a.startAt, date)
        if (a?.endAt) payload.endAt = shiftToDate(a.endAt, date)
      }
      return api.updateCalendarActivity(id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['activities-upcoming'] })
      addToast({ title: 'Activity moved', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const openCreate = (type: string, date?: Date) => {
    setEditing(null)
    setPreset({ type, date: date || new Date() })
    setDialogOpen(true)
  }

  const openEdit = (a: any) => {
    setPreset(null)
    setEditing(a)
    setDialogOpen(true)
  }

  const navigate = (dir: 1 | -1) => {
    const next = new Date(anchor)
    if (view === 'month') next.setMonth(next.getMonth() + dir)
    else if (view === 'week') next.setDate(next.getDate() + 7 * dir)
    else next.setDate(next.getDate() + dir)
    setAnchor(next)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <CalendarDays size={20} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight text-slate-800 sm:text-xl dark:text-slate-100">{t('Calendar')}</h1>
                <p className="truncate text-sm text-muted-foreground">{formatAnchor(view, anchor)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setAnchor(new Date())}>{t('Today')}</Button>
              <Button size="sm" variant="outline" onClick={() => navigate(-1)}><ChevronLeft size={15} /></Button>
              <Button size="sm" variant="outline" onClick={() => navigate(1)}><ChevronRight size={15} /></Button>
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                {(['month', 'week', 'day', 'list', 'year'] as View[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors sm:px-3',
                      view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(v)}
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={() => openCreate('Meeting')}>
                <CalendarPlus size={15} className="mr-1.5" /> <span className="hidden sm:inline">{t('Add Event')}</span><span className="sm:hidden">{t('Event')}</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => openCreate('Task')}>
                <Plus size={15} className="mr-1.5" /> <span className="hidden sm:inline">{t('Add Task')}</span><span className="sm:hidden">{t('Task')}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-muted/30 px-4 py-2 text-[11px] font-medium text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wide">{t('Legend')}</span>
          {Object.entries(TYPE_STYLE).map(([tname, s]) => (
            <span key={tname} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', s.dot)} />{t(tname)}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 size={16} className="mr-2 animate-spin" /> {t('Loading...')}
          </div>
        ) : view === 'month' ? (
          <MonthView activities={activities} anchor={anchor} onCreate={openCreate} onEdit={openEdit} onMove={(id, d) => mutateMove.mutate({ id, date: d })} />
        ) : view === 'week' ? (
          <WeekView activities={activities} anchor={anchor} onCreate={openCreate} onEdit={openEdit} onMove={(id, d) => mutateMove.mutate({ id, date: d })} />
        ) : view === 'list' ? (
          <ListView activities={activities} anchor={anchor} onEdit={openEdit} />
        ) : view === 'year' ? (
          <YearView activities={activities} anchor={anchor} onSelect={(d) => { setAnchor(d); setView('month') }} />
        ) : (
          <DayView activities={activities} anchor={anchor} onCreate={openCreate} onEdit={openEdit} />
        )}
      </div>

      <ActivityDialog
        open={dialogOpen}
        onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditing(null); setPreset(null) } }}
        editing={editing}
        preset={preset}
        onDelete={(id) => { setDialogOpen(false); setDeleteId(id) }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) mutateDelete.mutate(deleteId); setDeleteId(null) }}
        title="Delete Activity"
        description="Are you sure you want to delete this activity?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function formatAnchor(view: View, anchor: Date) {
  if (view === 'month' || view === 'list') return `${monthNames()[anchor.getMonth()]} ${anchor.getFullYear()}`
  if (view === 'year') return String(anchor.getFullYear())
  if (view === 'week') {
    const start = new Date(anchor); start.setDate(anchor.getDate() - firstDayOffset(anchor))
    const end = new Date(start); end.setDate(start.getDate() + 6)
    return `${formatDate(start)} - ${formatDate(end)}`
  }
  return `${weekDayNames('long')[anchor.getDay()]}, ${formatDate(anchor)}`
}

function ActivityChip({ a, onClick }: { a: any; onClick: () => void }) {
  const style = TYPE_STYLE[a.activityType] || TYPE_STYLE.Other
  const done = a.activityType === 'Task' && a.status === 'Completed'
  const t = a.startAt ? timeLabel(new Date(a.startAt)) : a.dueAt ? timeLabel(new Date(a.dueAt)) : ''
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      draggable
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', a.id) }}
      onDragEnd={(e) => e.stopPropagation()}
      className={cn(
        'flex w-full items-center gap-1 truncate rounded border-l-2 px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity hover:brightness-95 cursor-grab active:cursor-grabbing',
        style.chip,
        done && 'opacity-50 line-through'
      )}
      title={a.subject}
    >
      {t && <span className="shrink-0 font-semibold tabular-nums opacity-80">{t}</span>}
      <span className="truncate">{a.subject}</span>
    </button>
  )
}

function DayDropTarget({ date, children, onMove }: { date: Date; children: React.ReactNode; onMove?: (id: string, d: Date) => void }) {
  const [over, setOver] = useState(false)
  return (
    <div
      className={cn('rounded-b-lg', over && 'ring-2 ring-indigo-400 bg-indigo-50/40 dark:bg-indigo-500/10')}
      onDragOver={(e) => { if (onMove) { e.preventDefault(); setOver(true) } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { if (!onMove) return; e.preventDefault(); setOver(false); const id = e.dataTransfer.getData('text/plain'); if (id) onMove(id, date) }}
    >
      {children}
    </div>
  )
}

function MonthView({ activities, anchor, onCreate, onEdit, onMove }: { activities: any[]; anchor: Date; onCreate: (type: string, date: Date) => void; onEdit: (a: any) => void; onMove?: (id: string, d: Date) => void }) {
  const days = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const start = new Date(first)
    start.setDate(first.getDate() - firstDayOffset(first))
    const out: Date[] = []
    for (let i = 0; i < 42; i++) { out.push(new Date(start)); start.setDate(start.getDate() + 1) }
    return out
  }, [anchor])
  const today = new Date()
  const weekDays = orderedWeekDayNames()

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-7 gap-1 px-3 pt-3 md:gap-1.5">
          {weekDays.map((d, i) => (
            <div key={i} className="px-1 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 p-3 md:gap-1.5">
          {days.map((day, i) => {
            const dayActs = activities.filter(a => sameDay(activityDay(a), day)).sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
            const inMonth = day.getMonth() === anchor.getMonth()
            const isToday = sameDay(day, today)
            const working = isWorkingDay(day)
            const hasActs = dayActs.length > 0
            return (
              <DayDropTarget key={i} date={day} onMove={onMove}>
                <button
                  onClick={() => onCreate('Meeting', day)}
                  className={cn(
                    'flex min-h-16 w-full flex-col gap-1 rounded-lg border p-1 text-left align-top transition-colors hover:bg-accent/40 md:min-h-28 md:p-1.5',
                    !inMonth && 'border-transparent bg-muted/10 opacity-70',
                    !working && !inMonth && 'bg-muted/5',
                    inMonth && hasActs && 'border-sky-200 bg-sky-50/60 dark:border-sky-800/60 dark:bg-sky-500/10',
                    inMonth && !hasActs && 'bg-card',
                    !working && inMonth && 'bg-muted/5',
                    isToday && 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-500/10'
                  )}
                >
                  <span className={cn(
                    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isToday ? 'bg-indigo-600 text-white' : hasActs ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : !working ? 'opacity-60' : 'text-slate-700 dark:text-slate-200'
                  )}>
                    {day.getDate()}
                  </span>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayActs.slice(0, 3).map(a => <ActivityChip key={a.id} a={a} onClick={() => onEdit(a)} />)}
                    {dayActs.length > 3 && <span className="px-1 text-[10px] font-medium text-sky-600 dark:text-sky-400">+{dayActs.length - 3} more</span>}
                  </div>
                </button>
              </DayDropTarget>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function WeekView({ activities, anchor, onCreate, onEdit, onMove }: { activities: any[]; anchor: Date; onCreate: (type: string, date: Date) => void; onEdit: (a: any) => void; onMove?: (id: string, d: Date) => void }) {
  const days = useMemo(() => {
    const start = new Date(anchor)
    start.setDate(anchor.getDate() - firstDayOffset(anchor))
    const out: Date[] = []
    for (let i = 0; i < 7; i++) { out.push(new Date(start)); start.setDate(start.getDate() + 1) }
    return out
  }, [anchor])
  const today = new Date()
  const shortNames = weekDayNames('short')

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-7 gap-1 p-3 md:gap-1.5">
        {days.map((day, i) => {
          const dayActs = activities.filter(a => sameDay(activityDay(a), day)).sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
          const isToday = sameDay(day, today)
          const working = isWorkingDay(day)
          return (
            <div key={i} className={cn('flex flex-col rounded-lg border', !working && 'bg-muted/5', isToday && 'border-indigo-300 bg-indigo-50/40 dark:border-indigo-700 dark:bg-indigo-500/5')}>
              <button
                onClick={() => onCreate('Meeting', day)}
                className={cn('w-full rounded-t-lg border-b px-2 py-1.5 text-center transition-colors hover:bg-accent/40', isToday ? 'bg-indigo-50 dark:bg-indigo-500/10' : '')}
              >
                <div className={cn('text-[11px] font-medium uppercase tracking-wide text-muted-foreground', !working && 'opacity-50')}>{shortNames[day.getDay()]}</div>
                <div className={cn('mx-auto mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', isToday ? 'bg-indigo-600 text-white' : dayActs.length ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200', !working && 'opacity-50')}>{day.getDate()}</div>
              </button>
              <DayDropTarget date={day} onMove={onMove}>
                <div className="flex min-h-32 flex-col gap-1 p-1.5">
                  {dayActs.map(a => <ActivityChip key={a.id} a={a} onClick={() => onEdit(a)} />)}
                  {dayActs.length === 0 && <span className="px-1.5 py-1 text-[11px] text-muted-foreground/60">{t('No activities')}</span>}
                </div>
              </DayDropTarget>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({ activities, anchor, onCreate, onEdit }: { activities: any[]; anchor: Date; onCreate: (type: string, date: Date) => void; onEdit: (a: any) => void }) {
  const dayActs = activities
    .filter(a => sameDay(activityDay(a), anchor))
    .sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
  const { start, end } = workingHourRange()
  const hours: number[] = []
  for (let h = Math.floor(start); h < Math.ceil(end); h++) hours.push(h)
  const nonWorking: number[] = []
  for (let h = 0; h < 24; h++) if (!hours.includes(h)) nonWorking.push(h)

  const atHour = (h: number) => dayActs.filter(a => {
    const d = activityDay(a)
    const mins = d.getHours() * 60 + d.getMinutes()
    const spanStart = a.startAt ? new Date(a.startAt).getTime() : d.getTime()
    const spanEnd = a.endAt ? new Date(a.endAt).getTime() : a.startAt ? new Date(a.startAt).getTime() + 60 * 60 * 1000 : d.getTime()
    const hStart = new Date(anchor); hStart.setHours(h, 0, 0, 0)
    const hEnd = new Date(anchor); hEnd.setHours(h + 1, 0, 0, 0)
    return spanStart < hEnd.getTime() && spanEnd > hStart.getTime() || mins >= h * 60 && mins < (h + 1) * 60
  })

  const HourBlock = ({ h, working }: { h: number; working: boolean }) => {
    const acts = atHour(h)
    const label = `${pad(h)}:00`
    return (
      <div className={cn('flex gap-2 border-b last:border-b-0', !working && 'bg-muted/10')}>
        <div className={cn('w-14 shrink-0 py-2 text-right pr-2 text-xs text-muted-foreground', working ? 'font-medium' : 'opacity-50')}>{label}</div>
        <div className="flex-1 space-y-1 py-1 min-h-9">
          {acts.map(a => (
            <button key={a.id} onClick={() => onEdit(a)} className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-accent/40">
              <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', (TYPE_STYLE[a.activityType] || TYPE_STYLE.Other).dot)} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{a.subject}</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {a.startAt && <span className="flex items-center gap-1"><Clock size={11} />{timeLabel(new Date(a.startAt))}{a.endAt ? ` - ${timeLabel(new Date(a.endAt))}` : ''}</span>}
                  {a.dueAt && <span className="flex items-center gap-1"><Clock size={11} />Due {timeLabel(new Date(a.dueAt))}</span>}
                  {a.location && <span className="flex items-center gap-1"><MapPin size={11} />{a.location}</span>}
                  <span className="flex items-center gap-1">{a.activityType}{a.status ? ` · ${a.status}` : ''}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] p-2">
        <button onClick={() => onCreate('Meeting', anchor)} className="w-full rounded-lg px-2 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/40">
          + {t('Add on')} {weekDayNames('long')[anchor.getDay()]}, {formatDate(anchor)}
        </button>
        {dayActs.length === 0 && <p className="px-2 py-4 text-center text-sm text-muted-foreground">{t('No activities for this day.')}</p>}
        <div className="mt-1 rounded-lg border">
          {hours.map(h => <HourBlock key={h} h={h} working />)}
          {nonWorking.map(h => <HourBlock key={h} h={h} working={false} />)}
        </div>
      </div>
    </div>
  )
}

function ListView({ activities, anchor, onEdit }: { activities: any[]; anchor: Date; onEdit: (a: any) => void }) {
  const sorted = [...activities].sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
  const events = sorted.filter(a => a.activityType !== 'Task')
  const tasks = sorted.filter(a => a.activityType === 'Task')

  const Section = ({ title, items }: { title: string; items: any[] }) => (
    <div>
      <div className="flex items-center justify-between bg-muted/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{t(title)}</span>
        <span className="rounded-full bg-background px-2 py-0.5 text-[10px]">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-center text-sm text-muted-foreground">{t(`No ${title.toLowerCase()} this month.`)}</p>
      ) : (
        <div className="divide-y">
          {items.map(a => (
            <button key={a.id} onClick={() => onEdit(a)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent/40">
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', (TYPE_STYLE[a.activityType] || TYPE_STYLE.Other).dot)} />
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                {formatDate(activityDay(a))}
                {a.startAt ? ' · ' + timeLabel(new Date(a.startAt)) : a.dueAt ? ' · ' + timeLabel(new Date(a.dueAt)) : ''}
              </span>
              <span className="min-w-0 flex-1 truncate text-left font-medium">{a.subject}</span>
              <span className="hidden items-center gap-1 text-xs text-muted-foreground shrink-0 sm:flex">
                {a.location && <span className="flex items-center gap-1"><MapPin size={11} />{a.location}</span>}
                {a.status && (
                  <span className={cn('rounded px-1.5 py-0.5 text-[11px]', a.activityType === 'Task' && a.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-muted text-muted-foreground')}>
                    {a.status}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="border-b bg-muted/20 px-4 py-2.5 text-sm font-medium text-muted-foreground">
        {monthNames()[anchor.getMonth()]} {anchor.getFullYear()} — drag rows between day cells in Month/Week view to reschedule
      </div>
      <Section title="Events" items={events} />
      <Section title="Tasks" items={tasks} />
    </div>
  )
}

function YearView({ activities, anchor, onSelect }: { activities: any[]; anchor: Date; onSelect: (d: Date) => void }) {
  const months = Array.from({ length: 12 }, (_, m) => {
    const count = activities.filter(a => new Date(activityDay(a)).getMonth() === m).length
    const events = activities.filter(a => a.activityType !== 'Task' && new Date(activityDay(a)).getMonth() === m).length
    const tasks = activities.filter(a => a.activityType === 'Task' && new Date(activityDay(a)).getMonth() === m).length
    return { m, count, events, tasks }
  })
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
      {months.map(({ m, count, events, tasks }) => {
        const d = new Date(anchor.getFullYear(), m, 1)
        const isCurrent = m === new Date().getMonth() && anchor.getFullYear() === new Date().getFullYear()
        return (
          <button
            key={m}
            onClick={() => onSelect(d)}
            className={cn(
              'group rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700',
              isCurrent && 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">{monthNames()[m]}</p>
              <span className={cn('h-2 w-2 rounded-full', isCurrent ? 'bg-indigo-500' : 'bg-muted')} />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{count}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{events} events · {tasks} tasks</p>
          </button>
        )
      })}
    </div>
  )
}

function ActivityDialog({ open, onOpenChange, editing, preset, onDelete }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: any | null
  preset: { type: string; date: Date } | null
  onDelete: (id: string) => void
}) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const editingId = editing?.id
  const [form, setForm] = useState<any>(emptyForm(null))

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        subject: editing.subject || '',
        activityType: editing.activityType || 'Task',
        status: editing.status || 'Planned',
        priority: editing.priority || 'Medium',
        location: editing.location || '',
        startAt: editing.startAt ? toLocalInput(new Date(editing.startAt)) : '',
        endAt: editing.endAt ? toLocalInput(new Date(editing.endAt)) : '',
        dueAt: editing.dueAt ? toLocalInput(new Date(editing.dueAt)) : '',
        description: editing.description || '',
      })
    } else {
      setForm(emptyForm(preset))
    }
  }, [open, editing, preset])

  const isTask = form.activityType === 'Task'

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createCalendarActivity(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['activities-upcoming'] })
      addToast({ title: t('Activity created'), variant: 'success' })
      onOpenChange(false)
    },
    onError: (e: Error) => addToast({ title: t('Error'), description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateCalendarActivity(editingId, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['activities-upcoming'] })
      addToast({ title: t('Activity updated'), variant: 'success' })
      onOpenChange(false)
    },
    onError: (e: Error) => addToast({ title: t('Error'), description: e.message, variant: 'destructive' }),
  })

  const submit = () => {
    if (!form.subject) { addToast({ title: t('Error'), description: t('Subject is required'), variant: 'destructive' }); return }
    const payload: any = {
      subject: form.subject,
      activityType: form.activityType,
      status: form.status,
      priority: form.priority,
      description: form.description,
    }
    if (isTask) payload.dueAt = form.dueAt || null
    else {
      payload.startAt = form.startAt || null
      payload.endAt = form.endAt || null
      payload.location = form.location
    }
    if (editingId) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editingId ? (isTask ? 'Edit Task' : 'Edit Event') : (isTask ? 'Add Task' : 'Add Event')}</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-3">
          <Input placeholder={t('Subject')} value={form.subject} onChange={e => setForm((f: any) => ({ ...f, subject: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('Type')}</label>
              <Select value={form.activityType} onValueChange={(v) => setForm((f: any) => ({ ...f, activityType: v, status: 'Planned' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Task', 'Call', 'Meeting', 'Other'].map(tn => <SelectItem key={tn} value={tn}>{t(tn)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('Status')}</label>
              <Select value={form.status} onValueChange={(v) => setForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(isTask ? TASK_STATUS : EVENT_STATUS).map(s => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('Priority')}</label>
              <Select value={form.priority} onValueChange={(v) => setForm((f: any) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{t(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isTask ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">{t('Due')}</label>
                <Input type="datetime-local" value={form.dueAt} onChange={e => setForm((f: any) => ({ ...f, dueAt: e.target.value }))} />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium block mb-1.5">{t('Location')}</label>
                <Input placeholder={t('Location')} value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} />
              </div>
            )}
          </div>
          {!isTask && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">{t('Start')}</label>
                <Input type="datetime-local" value={form.startAt} onChange={e => setForm((f: any) => ({ ...f, startAt: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{t('End')}</label>
                <Input type="datetime-local" value={form.endAt} onChange={e => setForm((f: any) => ({ ...f, endAt: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('Description')}</label>
            <textarea placeholder={t('Description')} className={`${inputCls} h-20`} value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              {editingId && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(editingId)}>
                  <Trash2 size={14} className="mr-1.5" /> {t('Delete')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editingId ? t('Update') : t('Create')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
