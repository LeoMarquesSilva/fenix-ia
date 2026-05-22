import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'fenix-sidebar-collapsed'

type SidebarLayoutValue = {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  toggleCollapsed: () => void
  sidebarWidthPx: number
}

const SidebarLayoutContext = createContext<SidebarLayoutValue | null>(null)

export function SidebarLayoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v)
    try {
      localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((c) => {
      const n = !c
      try {
        localStorage.setItem(STORAGE_KEY, n ? '1' : '0')
      } catch {
        /* ignore */
      }
      return n
    })
  }, [])

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      sidebarWidthPx: collapsed ? 80 : 280,
    }),
    [collapsed, setCollapsed, toggleCollapsed]
  )

  return (
    <SidebarLayoutContext.Provider value={value}>
      {children}
    </SidebarLayoutContext.Provider>
  )
}

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext)
  if (!ctx) {
    throw new Error('useSidebarLayout must be used within SidebarLayoutProvider')
  }
  return ctx
}
