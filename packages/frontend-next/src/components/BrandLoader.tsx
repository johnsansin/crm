'use client'

export function BrandLoader({ label = 'Loading BizForce CRM' }: { label?: string }) {
  return (
    <div className="bizforce-loader" role="status" aria-live="polite" aria-label={label}>
      <span className="bizforce-loader-glow" />
      <img src="/bizforce-mark.svg" alt="" className="bizforce-loader-icon" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
