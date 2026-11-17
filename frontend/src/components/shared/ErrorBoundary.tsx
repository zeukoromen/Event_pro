import React, { Component, type ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI exception captured by ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    localStorage.removeItem('event_pro_dev_user')
    localStorage.removeItem('event_pro_dev_token')
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--surface))] px-4 text-center">
          <div className="mb-4 rounded-full bg-[hsl(var(--destructive)/0.1)] p-4 text-[hsl(var(--destructive))]">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-2xl">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-md text-sm text-[hsl(var(--muted-foreground))]">
            {this.state.error?.message || 'An unexpected error occurred during rendering.'}
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => window.location.reload()} size="sm">
              Reload page
            </Button>
            <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset session
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
