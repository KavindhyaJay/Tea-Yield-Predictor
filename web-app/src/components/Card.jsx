/** Plain white card with a subtle border — the only card style in the app. */
export default function Card({ title, description, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`ty-card ${className}`}>
      {title ? (
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
        </div>
      ) : null}
      <div className={bodyClassName || 'px-5 py-4'}>{children}</div>
    </section>
  )
}
