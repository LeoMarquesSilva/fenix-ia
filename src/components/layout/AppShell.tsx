import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useSidebarLayout } from '@/contexts/SidebarLayoutContext'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './AppSidebar'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { collapsed } = useSidebarLayout()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-muted/40 dark:bg-background">
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col">
          <AppSidebar />
        </div>

        <div
          className={cn(
            'flex min-h-screen flex-col transition-[padding] duration-200 ease-out',
            collapsed ? 'lg:pl-20' : 'lg:pl-[280px]'
          )}
        >
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="h-full border-r border-sidebar-border bg-sidebar">
                  <AppSidebar
                    onNavigate={() => setMobileOpen(false)}
                    forceExpanded
                  />
                </div>
              </SheetContent>
            </Sheet>
            <span className="truncate text-sm font-semibold text-foreground">
              Fênix — Biblioteca de teses
            </span>
          </header>

          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
