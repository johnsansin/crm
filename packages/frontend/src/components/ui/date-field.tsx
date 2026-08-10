import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useOrgSettings, formatDate, formatDateTime } from '@/lib/org-format'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-react'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const TOKEN_RE = /yyyy|yy|mm|dd|M|d/g

function buildParseRegex(dateFormat: string) {
  let pattern = ''
  let last = 0
  let m: RegExpExecArray | null
  const tokens: Array<'y' | 'm' | 'd'> = []
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(dateFormat))) {
    pattern += escapeRegex(dateFormat.slice(last, m.index))
    const tok = m[0]
    if (tok === 'yyyy') { pattern += '(\\d{4})'; tokens.push('y') }
    else if (tok === 'yy') { pattern += '(\\d{2})'; tokens.push('y') }
    else if (tok === 'mm' || tok === 'M') { pattern += '(\\d{1,2})'; tokens.push('m') }
    else { pattern += '(\\d{1,2})'; tokens.push('d') }
    last = m.index + tok.length
  }
  pattern += escapeRegex(dateFormat.slice(last))
  return { regex: new RegExp('^' + pattern + '$'), tokens }
}

export function parseDateText(text: string, dateFormat: string): string | null {
  const t = text.trim()
  if (!t) return ''
  const { regex, tokens } = buildParseRegex(dateFormat)
  const m = t.match(regex)
  if (!m) return null
  let y = 0, mo = 0, d = 0
  tokens.forEach((kind, i) => {
    const v = parseInt(m[i + 1], 10)
    if (kind === 'y') y = v
    else if (kind === 'm') mo = v
    else d = v
  })
  if (y < 100) y += 2000
  if (!y || !mo || !d) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${pad(y)}-${pad(mo)}-${pad(d)}`
}

export function parseDateTimeText(text: string, dateFormat: string): string | null {
  const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/)
  if (!timeMatch) return null
  let h = parseInt(timeMatch[1], 10)
  const min = parseInt(timeMatch[2], 10)
  const ampm = timeMatch[3]
  if (ampm) {
    const isPm = ampm.toLowerCase() === 'pm'
    if (isPm && h < 12) h += 12
    if (!isPm && h === 12) h = 0
  }
  if (h > 23 || min > 59) return null
  const dateIso = parseDateText(text.replace(timeMatch[0], ''), dateFormat)
  if (!dateIso) return null
  return `${dateIso}T${pad(h)}:${pad(min)}`
}

interface DateFieldProps {
  value?: string | null
  onChange: (iso: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  min?: string
  max?: string
  required?: boolean
}

export function DateField({ value, onChange, className, disabled, placeholder, min, max, required }: DateFieldProps) {
  const { dateFormat } = useOrgSettings()
  const pickerRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(value ? formatDate(value) : '')
  const iso = value ? String(value).slice(0, 10) : ''

  const handleChange = (t: string) => {
    setText(t)
    const parsed = parseDateText(t, dateFormat)
    if (parsed) onChange(parsed)
  }

  const openPicker = () => {
    try { pickerRef.current?.showPicker?.() } catch { }
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        value={text}
        placeholder={placeholder || dateFormat?.toUpperCase()}
        onChange={e => handleChange(e.target.value)}
        onClick={openPicker}
        onBlur={() => setText(iso ? formatDate(iso) : '')}
        className="pr-8"
        disabled={disabled}
        required={required}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={openPicker}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        title="Pick date"
      >
        <CalendarIcon size={15} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        value={iso}
        min={min}
        max={max}
        tabIndex={-1}
        aria-hidden="true"
        onChange={e => {
          const v = e.target.value
          onChange(v)
          setText(v ? formatDate(v) : '')
        }}
      />
    </div>
  )
}

export function DateTimeField({ value, onChange, className, disabled }: {
  value?: string | null
  onChange: (v: string) => void
  className?: string
  disabled?: boolean
}) {
  const { dateFormat } = useOrgSettings()
  const pickerRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(value ? formatDateTime(value) : '')
  const localVal = value ? (String(value).includes('T') ? String(value).slice(0, 16) : '') : ''

  const handleChange = (t: string) => {
    setText(t)
    const parsed = parseDateTimeText(t, dateFormat)
    if (parsed) onChange(parsed)
  }

  const openPicker = () => {
    try { pickerRef.current?.showPicker?.() } catch { }
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        value={text}
        placeholder={dateFormat?.toUpperCase() + ' HH:MM'}
        onChange={e => handleChange(e.target.value)}
        onClick={openPicker}
        onBlur={() => setText(value ? formatDateTime(value) : '')}
        className="pr-8"
        disabled={disabled}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={openPicker}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        title="Pick date/time"
      >
        <CalendarIcon size={15} />
      </button>
      <input
        ref={pickerRef}
        type="datetime-local"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        value={localVal}
        tabIndex={-1}
        aria-hidden="true"
        onChange={e => {
          const v = e.target.value
          onChange(v)
          setText(v ? formatDateTime(v) : '')
        }}
      />
    </div>
  )
}
