'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'

export default function AppShell({ children }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <div className="ml-56">
        <TopHeader />
        <main className="pt-14 min-h-screen">{children}</main>
      </div>
    </>
  )
}
