import { useEffect, useState, useCallback } from 'react'

export function useAsyncData(loader, deps = []) {
  const [version, setVersion] = useState(0)
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
  }, [...deps, version])

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  return { ...state, refetch }
}
