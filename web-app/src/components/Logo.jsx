/** Small tea-leaf mark shown beside the application name in the sidebar. */
export default function Logo({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20.5 3.5c0 9.4-5.6 14.6-12.4 14.6-1.1 0-2.2-.2-3.2-.5 1.6-5.9 6.2-10.4 11.9-11.6-5.4.4-10 3.6-12 8.5-.9-1.7-1.4-3.6-1.4-5.5 0-3.6 3.2-5.5 8.9-5.5h8.2Z"
        fill="#7BC47F"
      />
      <path
        d="M3.5 21.5c1.3-3.9 3.6-7.2 6.8-9.6"
        stroke="#A8D8AC"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
