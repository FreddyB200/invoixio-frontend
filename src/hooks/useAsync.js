import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Ejecuta `fn` (async) al montar y cada vez que cambian `deps`.
 * Devuelve { data, loading, error, reload }. Ignora respuestas de peticiones ya obsoletas.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const ultima = useRef(0)

  const ejecutar = useCallback(() => {
    const id = ++ultima.current
    setState((s) => ({ ...s, loading: true, error: null }))
    return fn().then(
      (data) => { if (id === ultima.current) setState({ data, loading: false, error: null }) },
      (error) => { if (id === ultima.current) setState((s) => ({ data: s.data, loading: false, error })) },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { ejecutar() }, [ejecutar])

  return { ...state, reload: ejecutar }
}
