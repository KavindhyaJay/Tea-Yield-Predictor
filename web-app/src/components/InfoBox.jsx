import { Info } from 'lucide-react'

/** Subtle light-blue note used beneath the SHAP plots. */
export default function InfoBox({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-info-border bg-info-bg px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-info-icon" strokeWidth={2} />
      <div className="space-y-0.5 text-xs leading-relaxed text-info-text">{children}</div>
    </div>
  )
}
