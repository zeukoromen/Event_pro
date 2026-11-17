import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import './index.css'
import App from './App'

/**
 * main.tsx — application bootstrap.
 *
 * Wraps the app in:
 *   BrowserRouter   → client-side routing via React Router
 *   QueryClientProvider → server state management via TanStack Query
 *   StrictMode      → highlights potential issues during development
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 60 seconds before a background refetch
      staleTime: 60_000,
      // Retry failed requests once before showing an error
      retry: 1,
      // Don't refetch just because the user switched browser tabs
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
