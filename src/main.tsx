import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import './lib/test-connection'

// Interceptar todos os erros de AbortError globalmente
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason
  if (
    error?.name === 'AbortError' ||
    error?.message?.includes('AbortError') ||
    error?.message?.includes('aborted') ||
    error?.message?.includes('signal is aborted')
  ) {
    // Prevenir que o erro apareça no console
    event.preventDefault()
    return
  }
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Retry em erros de abort também
        const isAbortError =
          error?.name === 'AbortError' ||
          error?.message?.includes('AbortError') ||
          error?.message?.includes('aborted')
        if (isAbortError) {
          // Retry até 3 vezes em caso de abort
          return failureCount < 3
        }
        return failureCount < 2 // Retry até 2 vezes para outros erros
      },
      retryOnMount: true, // Permitir retry ao montar
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      // Desabilitar cancelamento automático de queries
      gcTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
)
