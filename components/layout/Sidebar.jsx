'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOutIcon } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Event Log', href: '/event-log' },
  { label: 'Personal State', href: '/personal-state' },
  { label: 'Ori State', href: '/ori-state' },
  { label: 'Content OS', href: '/content-os' },
  { label: 'Pipeline', href: '/pipeline' },
  { label: 'Clients', href: '/clients' },
  { label: 'Production', href: '/production' },
  { label: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#fdf2f6] border-r border-[#f0e8ee] flex flex-col z-20">
      <div className="px-6 py-5 border-b border-[#f0e8ee]">
        <h1 className="text-base font-semibold text-[#1a1a2e] tracking-tight">ORI Sprint OS</h1>
        <p className="text-xs text-[#9ca3af] mt-0.5">18-Day Revenue System</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#fce4ed] text-[#e879a0] font-medium'
                  : 'text-[#4b5563] hover:bg-[#fce4ed]/60 hover:text-[#e879a0]'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[#f0e8ee] space-y-2">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/login'
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#9ca3af] hover:bg-[#fce4ed]/60 hover:text-[#e879a0] transition-colors"
        >
          <LogOutIcon size={14} />
          Logout
        </button>
        <p className="text-[10px] text-[#c4b5c0] px-3">Sprint OS v1.0</p>
      </div>
    </aside>
  )
}
