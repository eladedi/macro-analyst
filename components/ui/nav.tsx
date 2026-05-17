'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/metrics', label: 'Metrics' },
  { href: '/charts', label: 'Charts' },
  { href: '/ai', label: 'AI Interpretation' },
  { href: '/snapshots', label: 'Snapshots' },
  { href: '/settings', label: 'Settings' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <aside className="w-52 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Macro Monitor</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? 'block px-3 py-2 rounded text-sm font-medium bg-slate-800 text-white'
                  : 'block px-3 py-2 rounded text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors'
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-xs text-slate-600">v0.1 — personal</p>
      </div>
    </aside>
  )
}
