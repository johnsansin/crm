import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, CalendarPlus, Pencil, Trash2, Loader2, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useOrgSettings, formatDate, formatTime, monthNames, weekDayNames,
  orderedWeekDayNames, firstDayOffset, isWorkingDay, workingHourRange, weekdayShort,
} from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const TYPE_COLORS: Record<string, string> = {
  Task: 'bg-blue-500',
  Call: 'bg-emerald-500',
  Meeting: 'bg-purple-500',
  Other: 'bg-slate-500',
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Events and tasks for your organization</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAnchor(new Date())}>Today</Button>
          <Button size="sm" variant="outline" onClick={() => navigate(-1)}><ChevronLeft size={15} /></Button>
          <Button size="sm" variant="outline" onClick={() => navigate(1)}><ChevronRight size={15} /></Button>
          <span className="text-sm font-semibold w-40 text-center hidden md:block">{formatAnchor(view, anchor)}</span>
          <div className="flex rounded-md border">
            {(['month', 'week', 'day', 'list', 'year'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1.5 text-xs font-medium capitalize', view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}>
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => openCreate('Meeting')}><CalendarPlus size={15} className="mr-1.5" /> Add Event</Button>
          <Button size="sm" variant="outline" onClick={() => openCreate('Task')}><Plus size={15} className="mr-1.5" /> Add Task</Button>
        </div>
      </div>

      <div className="text-sm font-semibold md:hidden">{formatAnchor(view, anchor)}</div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin mr-2" /> Loading...
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
  const color = TYPE_COLORS[a.activityType] || TYPE_COLORS.Other
  const done = a.activityType === 'Task' && a.status === 'Completed'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      draggable
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', a.id) }}
      onDragEnd={(e) => e.stopPropagation()}
      className={cn('w-full text-left text-xs px-1.5 py-0.5 rounded text-white truncate cursor-grab active:cursor-grabbing', color, done && 'opacity-50 line-through')}
      title={a.subject}
    >
      {a.startAt ? timeLabel(new Date(a.startAt)) + ' ' : a.dueAt ? timeLabel(new Date(a.dueAt)) + ' ' : ''}
      {a.subject}
    </button>
  )
}

function DayDropTarget({ date, children, onMove }: { date: Date; children: React.ReactNode; onMove?: (id: string, d: Date) => void }) {
  const [over, setOver] = useState(false)
  return (
    <div
      className={cn(over && 'ring-2 ring-primary/60 bg-primary/5')}
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
    <div>
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((d, i) => (
          <div key={i} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayActs = activities.filter(a => sameDay(activityDay(a), day)).sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
          const inMonth = day.getMonth() === anchor.getMonth()
          const isToday = sameDay(day, today)
          const working = isWorkingDay(day)
          return (
            <DayDropTarget key={i} date={day} onMove={onMove}>
              <button
                onClick={() => onCreate('Meeting', day)}
                className={cn(
                  'min-h-24 md:min-h-28 w-full text-left align-top p-1.5 border-b border-r last:border-r-0 hover:bg-accent/40 transition-colors flex flex-col gap-1',
                  !inMonth && 'bg-muted/30',
                  !working && 'bg-muted/10'
                )}
              >
                <span className={cn('text-xs font-medium inline-flex items-center justify-center h-6 w-6 rounded-full', isToday ? 'bg-primary text-primary-foreground' : '', !working && 'opacity-50')}>
                  {day.getDate()}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayActs.slice(0, 3).map(a => <ActivityChip key={a.id} a={a} onClick={() => onEdit(a)} />)}
                  {dayActs.length > 3 && <span className="text-[10px] text-muted-foreground px-1">+{dayActs.length - 3} more</span>}
                </div>
              </button>
            </DayDropTarget>
          )
        })}
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
    <div className="grid grid-cols-7">
      {days.map((day, i) => {
        const dayActs = activities.filter(a => sameDay(activityDay(a), day)).sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
        const isToday = sameDay(day, today)
        const working = isWorkingDay(day)
        return (
          <div key={i} className={cn('min-h-40 border-r last:border-r-0 border-b', !working && 'bg-muted/10')}>
            <button
              onClick={() => onCreate('Meeting', day)}
              className={cn('w-full text-center py-2 border-b hover:bg-accent/40', isToday ? 'bg-primary/10' : '')}
            >
              <div className={cn('text-xs text-muted-foreground uppercase', !working && 'opacity-50')}>{shortNames[day.getDay()]}</div>
              <div className={cn('text-sm font-bold inline-flex items-center justify-center h-7 w-7 rounded-full', isToday ? 'bg-primary text-primary-foreground' : '', !working && 'opacity-50')}>{day.getDate()}</div>
            </button>
            <DayDropTarget date={day} onMove={onMove}>
              <div className="flex flex-col gap-1 p-1">
                {dayActs.map(a => <ActivityChip key={a.id} a={a} onClick={() => onEdit(a)} />)}
                {dayActs.length === 0 && <span className="text-xs text-muted-foreground/60 p-1.5">No activities</span>}
              </div>
            </DayDropTarget>
          </div>
        )
      })}
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
        <div className="flex-1 py-1 space-y-1 min-h-9">
          {acts.map(a => (
            <button key={a.id} onClick={() => onEdit(a)} className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-accent/40">
              <span className={cn('mt-1 h-2.5 w-2.5 rounded-full shrink-0', TYPE_COLORS[a.activityType] || TYPE_COLORS.Other)} />
              <span className="min-w-0">
                <span className="text-sm font-medium block truncate">{a.subject}</span>
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
    <div className="p-2">
      <button onClick={() => onCreate('Meeting', anchor)} className="w-full text-left px-2 py-2 text-xs text-muted-foreground rounded hover:bg-accent/40">
        + Add on {weekDayNames('long')[anchor.getDay()]}, {formatDate(anchor)}
      </button>
      {dayActs.length === 0 && <p className="px-2 py-4 text-center text-sm text-muted-foreground">No activities for this day.</p>}
      <div className="mt-1 border rounded-md">
        {hours.map(h => <HourBlock key={h} h={h} working />)}
        {nonWorking.map(h => <HourBlock key={h} h={h} working={false} />)}
      </div>
    </div>
  )
}

function ListView({ activities, anchor, onEdit }: { activities: any[]; anchor: Date; onEdit: (a: any) => void }) {
  const sorted = [...activities].sort((a, b) => activityDay(a).getTime() - activityDay(b).getTime())
  const events = sorted.filter(a => a.activityType !== 'Task')
  const tasks = sorted.filter(a => a.activityType === 'Task')

  const Section = ({ title, items }: { title: string; items: any[] }) => (
    <div className="border-b last:border-0">
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40">{title} ({items.length})</div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground text-center">No {title.toLowerCase()} this month.</p>
      ) : items.map(a => (
        <button key={a.id} onClick={() => onEdit(a)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/40 transition-colors border-t first:border-t-0">
          <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', TYPE_COLORS[a.activityType] || TYPE_COLORS.Other)} />
          <span className="w-28 shrink-0 text-xs text-muted-foreground">
            {formatDate(activityDay(a))}
            {a.startAt ? ' · ' + timeLabel(new Date(a.startAt)) : a.dueAt ? ' · ' + timeLabel(new Date(a.dueAt)) : ''}
          </span>
          <span className="font-medium truncate flex-1 text-left">{a.subject}</span>
          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            {a.location && <span className="flex items-center gap-1"><MapPin size={11} />{a.location}</span>}
            {a.status && <span className={cn('px-1.5 py-0.5 rounded text-[11px]', a.activityType === 'Task' && a.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-muted text-muted-foreground')}>{a.status}</span>}
          </span>
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <div className="px-4 py-2.5 text-sm font-medium text-muted-foreground border-b bg-muted/20">
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {months.map(({ m, count, events, tasks }) => {
        const d = new Date(anchor.getFullYear(), m, 1)
        const isCurrent = m === new Date().getMonth() && anchor.getFullYear() === new Date().getFullYear()
        return (
          <button
            key={m}
            onClick={() => onSelect(d)}
            className={cn('rounded-lg border p-4 text-left hover:shadow-md transition-shadow hover:border-primary/40', isCurrent && 'border-primary/50 bg-primary/5')}
          >
            <p className="text-sm font-semibold capitalize">{monthNames()[m]}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{events} events · {tasks} tasks</p>
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
      addToast({ title: 'Activity created', variant: 'success' })
      onOpenChange(false)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateCalendarActivity(editingId, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['activities-upcoming'] })
      addToast({ title: 'Activity updated', variant: 'success' })
      onOpenChange(false)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const submit = () => {
    if (!form.subject) { addToast({ title: 'Error', description: 'Subject is required', variant: 'destructive' }); return }
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
          <Input placeholder="Subject" value={form.subject} onChange={e => setForm((f: any) => ({ ...f, subject: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium block mb-1.5">Type</label>
              <Select value={form.activityType} onValueChange={(v) => setForm((f: any) => ({ ...f, activityType: v, status: 'Planned' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Task', 'Call', 'Meeting', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(isTask ? TASK_STATUS : EVENT_STATUS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium block mb-1.5">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm((f: any) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isTask ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">Due</label>
                <Input type="datetime-local" value={form.dueAt} onChange={e => setForm((f: any) => ({ ...f, dueAt: e.target.value }))} />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium block mb-1.5">Location</label>
                <Input placeholder="e.g. Meeting room" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} />
              </div>
            )}
          </div>
          {!isTask && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">Start</label>
                <Input type="datetime-local" value={form.startAt} onChange={e => setForm((f: any) => ({ ...f, startAt: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">End</label>
                <Input type="datetime-local" value={form.endAt} onChange={e => setForm((f: any) => ({ ...f, endAt: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1.5">Description</label>
            <textarea placeholder="Description" className={`${inputCls} h-20`} value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              {editingId && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(editingId)}>
                  <Trash2 size={14} className="mr-1.5" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
