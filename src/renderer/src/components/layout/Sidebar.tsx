import { cn } from '@renderer/lib/utils'
import {
  Home,
  FolderOpen,
  Settings,
  Plus,
  ArrowLeft,
  SwatchBook,
  Type,
  LayoutTemplate,
  ChartNoAxesCombined
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useT } from '@renderer/i18n'

export function Sidebar(): React.JSX.Element {
  const location = useLocation()
  const t = useT()
  const isDetailPage = location.pathname.startsWith('/sessions/') && location.pathname !== '/sessions'

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/sessions', icon: FolderOpen, label: t('nav.sessions') },
    { path: '/templates', icon: LayoutTemplate, label: t('nav.templates') },
    { path: '/styles', icon: SwatchBook, label: t('nav.styles') },
    { path: '/fonts', icon: Type, label: t('nav.fonts') },
    { path: '/token-usage', icon: ChartNoAxesCombined, label: t('nav.tokenUsage') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <aside className="flex h-full w-full flex-col bg-transparent">
      

      <nav className="flex-1 space-y-1 px-3 pb-4 pt-5">
        {isDetailPage && (
          <Link
            to="/sessions"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a5a3d] transition-colors hover:bg-[#efe5d3]/75"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('nav.backToSessions')}
          </Link>
        )}
        {navItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-[#dbe7ca]/80 text-[#2f3b28]'
                  : 'text-[#58664a] hover:bg-[#efe5d3]/75 hover:text-[#38452f]'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 pb-4">
        <Link
          to="/"
          className="flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-[#6f8159] to-[#4f613f] px-3 py-2.5 text-[12px] font-medium text-white shadow-lg shadow-[#5d6b4d]/30 transition-all hover:translate-y-[-1px]"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <Plus className="h-3.5 w-3.5 shrink-0" />
            {t('nav.newPresentation')}
          </span>
        </Link>
      </div>
    </aside>
  )
}
