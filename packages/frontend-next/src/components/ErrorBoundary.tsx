'use client'

import React from 'react'

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h2>
            <pre className="text-sm text-red-600 whitespace-pre-wrap break-words bg-red-50 p-3 rounded-lg overflow-auto max-h-64">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
