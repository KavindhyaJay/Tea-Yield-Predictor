import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  PenLine,
  Clock3,
  BarChart3,
  Info,
  LogOut,
  CircleDot,
  CalendarRange,
} from 'lucide-react'
import Logo from './Logo.jsx'
import { modelInfo } from '../data/modelInfo.js'

/** Navigation exactly as it appears in Figure 13 — order and labels are fixed. */
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  // The result screen belongs to the New Prediction flow, so the pill stays
  // there while it is open — as in Figure 13, panel 2.
  { to: '/new-prediction', label: 'New Prediction', icon: PenLine, alsoActiveOn: ['/result'] },
  { to: '/history', label: 'Prediction History', icon: Clock3 },
  { to: '/forecast', label: 'Yield Forecast', icon: CalendarRange },
  { to: '/shap', label: 'SHAP Explanations', icon: BarChart3 },
  { to: '/about', label: 'About', icon: Info },
  { to: '/logout', label: 'Logout', icon: LogOut },
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-sidebar text-white">
      <div className="flex items-center gap-2 px-5 pb-6 pt-6">
        <Logo />
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight">TeaYield</div>
          <div className="text-[13px] font-medium text-sidebar-text">Predictor</div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map(({ to, label, icon: Icon, alsoActiveOn = [] }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors',
                isActive || alsoActiveOn.includes(pathname)
                  ? 'bg-sidebar-active font-semibold text-white'
                  : 'font-medium text-sidebar-text hover:bg-white/5 hover:text-white',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-3">
        <div className="rounded-md border border-white/10 bg-sidebar-deep px-3 py-3">
          <div className="flex items-start gap-2">
            <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-light" strokeWidth={2} />
            <div className="leading-snug">
              <div className="text-[11px] font-semibold text-white">Model</div>
              <div className="text-[11px] font-semibold text-white">{modelInfo.name}</div>
              <div className="mt-1.5 text-[10px] text-sidebar-text">
                Best R² : {modelInfo.metrics.r2}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
