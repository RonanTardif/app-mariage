import { useEffect, useState } from 'react'

export function useAsyncData(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    let mounted = true
    setState((prev) => ({ ...prev, loading: true, error: null }))
    loader()
      .then((data) => mounted && setState({ data, loading: false, error: null }))
      .catch((error) => mounted && setState({ data: null, loading: false, error }))
    return () => {
      mounted = false
    }
  }, deps)

  return state
}
