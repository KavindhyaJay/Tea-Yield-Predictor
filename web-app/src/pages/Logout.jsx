import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'

/**
 * Placeholder for the sidebar's Logout entry. Authentication is not part of the
 * research scope, so this only confirms the action.
 */
export default function Logout() {
  return (
    <>
      <PageHeader title="Logout" subtitle="End the current session" />

      <div className="ty-card max-w-md px-5 py-6">
        <p className="flex items-center gap-2 text-[13px] text-ink">
          <LogOut className="h-4 w-4 text-muted" strokeWidth={2} />
          You have been signed out of TeaYield Predictor.
        </p>
        <Link to="/dashboard" className="ty-btn-primary mt-5">
          Return to Dashboard
        </Link>
      </div>
    </>
  )
}
