import { Component, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <main role="alert" style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 12, padding: 24, color: '#f4f7f8', background: '#101b25', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>O jogo não abriu corretamente</h1>
        <p style={{ maxWidth: 440, margin: 0, color: '#c3cdd3' }}>Atualize a página para tentar carregar a partida novamente.</p>
        <button type="button" onClick={() => window.location.reload()} style={{ justifySelf: 'center', marginTop: 8, padding: '12px 20px', border: 0, borderRadius: 10, color: '#101b25', background: '#67e4c1', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>Atualizar página</button>
      </main>
    }

    return this.props.children
  }
}
