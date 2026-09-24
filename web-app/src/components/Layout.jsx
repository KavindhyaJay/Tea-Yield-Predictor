import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

/**
 * The application shell from Figure 13: fixed dark green sidebar on the left,
 * compact white content area on the right, scrolling independently.
 */
export default function Layout() {
  return (
    <div className="flex h-full justify-center bg-page p-4">
      <div className="flex h-full w-full max-w-5xl overflow-hidden rounded-lg border border-line bg-card shadow-panel">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-card px-8 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
