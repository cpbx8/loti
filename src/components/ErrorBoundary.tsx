import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface p-8 text-center" style={{ height: '100dvh' }}>
          <div className="text-5xl">🦎</div>
          <h1 className="text-title text-on-surface">Something went wrong</h1>
          <p className="text-body text-on-surface-variant max-w-xs">
            Loti hit an unexpected error. Try refreshing — your data is safe.
          </p>
          {this.state.error && (
            <pre className="mt-2 max-w-xs overflow-auto rounded-xl bg-surface-container p-3 text-xs text-text-tertiary">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="btn-gradient mt-4 px-6 py-3 min-h-[48px]"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
