import { useCallback, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

export const useQuery = () => {
  const { search } = useLocation()
  const { push } = useHistory()
  const [params, setParams] = useState(new URLSearchParams(search))

  const setParam = useCallback(
    (k: string, v: any) => {
      params.set(k, v)
      push({
        search: params.toString(),
      })
    },
    [params]
  )

  useEffect(() => {
    setParams(new URLSearchParams(search))
  }, [search])

  return {
    params,
    setParam,
  }
}
