import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Search, GitCompare,
  ShieldAlert, Bell, FileText, Activity
} from 'lucide-react'
import { useAlertCount } from '@/lib/api'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assets', icon: Search, label: 'Assets' },
  { to: '/compare', icon: GitCompare, label: 'Compare' },
  { to: '/risk', icon: ShieldAlert, label: 'Risk Monitor' },
  { to: '/alerts', icon: Bell, label: 'Alert Center' },
  { to: '/research', icon: FileText, label: 'Research' },
]

export function Sidebar() {
  const { data: alertData } = useAlertCount()
  const unread = alertData?.unread_count ?? 0

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-card/50">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground leading-none">CIP</div>
            <div className="text-[10px] text-muted-foreground font-mono">Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'text-primary bg-primary/10 border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            {label === 'Alert Center' && unread > 0 && (
              <span className="ml-auto text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-[10px] text-muted-foreground font-mono leading-relaxed">
          <div className="text-primary/70 font-semibold mb-1">DATA SOURCES</div>
          <div>CoinGecko · DefiLlama</div>
          <div>DexScreener · Alt.me</div>
        </div>
      </div>
    </aside>
  )
}
