import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 24,
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              border: '1px solid var(--theme-primary, #ff4444)',
              borderRadius: 4,
              opacity: 0.8,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Panel Error</div>
            <div style={{ opacity: 0.6 }}>
              {this.state.error?.message ?? 'Unknown error'}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
