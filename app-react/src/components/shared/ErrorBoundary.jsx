import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-2xl">😕</p>
          <p className="font-semibold text-stone-700">Quelque chose s'est mal passé.</p>
          <p className="text-sm text-stone-500">{this.state.error?.message}</p>
          <button
            className="mt-2 rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700 hover:bg-rose-200"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
