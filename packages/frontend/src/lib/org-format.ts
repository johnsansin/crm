import { useSyncExternalStore } from 'react'

export interface OrgCalendarSettings {
  workingDays: string[]
  workingHoursStart: string
  workingHoursEnd: string
  firstDayOfWeek: string
}

export interface OrgFormatSettings {
  language: string
  timezone: string
  dateFormat: string
  calendar: OrgCalendarSettings
  defaultCurrency: string
  currencySymbol: string
}

const DEFAULT_CALENDAR: OrgCalendarSettings = {
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  firstDayOfWeek: 'Sunday',
}

const DEFAULT_SETTINGS: OrgFormatSettings = {
  language: 'en_us',
  timezone: 'Asia/Karachi',
  dateFormat: 'mm-dd-yyyy',
  calendar: DEFAULT_CALENDAR,
  defaultCurrency: 'USD',
  currencySymbol: '$',
}

let settings: OrgFormatSettings = DEFAULT_SETTINGS
const listeners = new Set<() => void>()

export function setOrgSettings(s: Partial<OrgFormatSettings>) {
  settings = {
    ...settings,
    ...s,
    calendar: { ...DEFAULT_CALENDAR, ...(s.calendar || {}) },
  }
  listeners.forEach((l) => l())
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return settings
}

export function useOrgSettings() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function orgLocale(): string {
  const l = settings.language || 'en_us'
  return l.replace('_', '-')
}

export function orgLanguage(): string {
  return settings.language || 'en_us'
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
}

function tzParts(d: Date): { y: string; m: string; d: string; h: string; min: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: settings.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '0'
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), min: get('minute') }
}

function toDate(value: any): Date | null {
  if (value == null || value === '') return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(value: any): string {
  const d = toDate(value)
  if (!d) return value == null ? '' : String(value)
  const { y, m, d: dd } = tzParts(d)
  const pattern = settings.dateFormat || 'mm-dd-yyyy'
  const yy = y.slice(2)
  return pattern
    .replace('yyyy', y)
    .replace('mm', m)
    .replace('dd', dd)
    .replace('yy', yy)
    .replace('M', String(parseInt(m, 10)))
    .replace('d', String(parseInt(dd, 10)))
}

export function formatTime(value: any): string {
  const d = toDate(value)
  if (!d) return value == null ? '' : String(value)
  return new Intl.DateTimeFormat(orgLocale(), {
    timeZone: settings.timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

export function formatDateTime(value: any): string {
  const dateStr = formatDate(value)
  if (!dateStr) return ''
  const timeStr = formatTime(value)
  return timeStr ? `${dateStr} ${timeStr}` : dateStr
}

export function formatNumber(value: any, digits = 2): string {
  const n = Number(value)
  if (isNaN(n)) return value == null ? '' : String(value)
  return new Intl.NumberFormat(orgLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

export function orgCurrency(): string {
  return settings.defaultCurrency || 'USD'
}

export function orgCurrencySymbol(): string {
  return settings.currencySymbol || '$'
}

export function formatMoney(value: any): string {
  const n = Number(value)
  if (isNaN(n)) return value == null ? '' : String(value)
  const code = orgCurrency()
  try {
    return new Intl.NumberFormat(orgLocale(), {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).format(n)
  } catch {
    return `${orgCurrencySymbol()}${formatNumber(n)}`
  }
}

export function monthNames(style: 'long' | 'short' = 'long'): string[] {
  const fmt = new Intl.DateTimeFormat(orgLocale(), { month: style, timeZone: settings.timezone })
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2024, i, 15))))
}

export function weekDayNames(style: 'long' | 'short' = 'short'): string[] {
  const fmt = new Intl.DateTimeFormat(orgLocale(), { weekday: style, timeZone: settings.timezone })
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2024, 6, 7 + i))))
}

export function orderedWeekDayNames(): string[] {
  const names = weekDayNames('short')
  const start = DAY_INDEX[settings.calendar.firstDayOfWeek] ?? 0
  return [...names.slice(start), ...names.slice(0, start)]
}

export function firstDayOffset(day: Date): number {
  const start = DAY_INDEX[settings.calendar.firstDayOfWeek] ?? 0
  return (day.getDay() - start + 7) % 7
}

export function weekdayShort(day: Date): string {
  return DAY_ABBR[day.getDay()] || ''
}

export function isWorkingDay(day: Date): boolean {
  return settings.calendar.workingDays.includes(weekdayShort(day))
}

export function workingHourRange(): { start: number; end: number } {
  const s = settings.calendar.workingHoursStart || '09:00'
  const e = settings.calendar.workingHoursEnd || '18:00'
  const [sh, sm] = s.split(':').map(Number)
  const [eh, em] = e.split(':').map(Number)
  return {
    start: (isNaN(sh) ? 9 : sh) + (isNaN(sm) ? 0 : sm) / 60,
    end: (isNaN(eh) ? 18 : eh) + (isNaN(em) ? 0 : em) / 60,
  }
}
