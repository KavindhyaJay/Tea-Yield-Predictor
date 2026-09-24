/** Dark green page title with a small grey supporting line beneath it. */
export default function PageHeader({ title, subtitle }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
    </header>
  )
}
