import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UserPlus, TrendingUp, LifeBuoy, PlusCircle, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useViewableModules } from '@/lib/permissions'

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, module: null },
  { to: '/leads', label: 'Leads', icon: UserPlus, module: 'leads' },
  { to: '/potentials', label: 'Sales', icon: TrendingUp, module: 'potentials' },
  { to: '/tickets', label: 'Support', icon: LifeBuoy, module: 'tickets' },
]

export function MobileBottomNav({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const viewable = useViewableModules()
  const navigate = useNavigate()
  const items = ITEMS.filter(i => !i.module || viewable.has(i.module))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) => cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground',
              isActive && 'text-indigo-600'
            )}
          >
            <item.icon size={19} strokeWidth={1.75} />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="relative flex flex-1 flex-col items-center py-2 text-[10px] font-medium text-muted-foreground"
          aria-label="Quick add"
        >
          <span className="grid h-9 w-9 -mt-3 place-items-center rounded-full bg-indigo-600 text-white shadow-md">
            <PlusCircle size={18} />
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground"
          aria-label="Menu"
        >
          <Menu size={19} strokeWidth={1.75} />
          Menu
        </button>
      </div>
    </nav>
  )
}
