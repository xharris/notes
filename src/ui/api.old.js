/**
 * yarn add axios
 */

import { useCallback, useEffect, useState } from 'react'
import { ObjectAny } from 'ui'
import axios, {
  AxiosPromise,
  AxiosResponse,
  CancelTokenSource,
  Method,
} from 'axios'

export const on = (...args) => document.addEventListener(...args)
export const off = (...args) => document.removeEventListener(...args)

export const dispatch = (type, eventInitDict) =>
  document.dispatchEvent(new CustomEvent(type, eventInitDict))

export const notify = (type, id) =>
  dispatch(`fetch_one_${type}`, {
    detail: { id },
  })

export const useNotify = (fn, type, id) => {
  const call = useCallback(
    (e) => {
      if (!id || e.detail.id === id) fn(e)
    },
    [fn, type, id]
  )

  useEffect(() => {
    if (type) {
      on(`fetch_one_${type}`, call)
      return () => {
        off(`fetch_one_${type}`, call)
      }
    }
  }, [])
}

const constructUrl = (suffix) =>
  suffix.startsWith('http')
    ? suffix
    : `${process.env.REACT_API_HOST}/api/${suffix}`

export const isCancel = axios.isCancel

const tokens = {}
const transform = (method, suffix, data, config) => {
  const url = constructUrl(suffix)
  if (!config) config = {}
  if (tokens[url]) tokens[url].cancel()
  tokens[url] = axios.CancelToken.source()
  return axios({
    method,
    url,
    data,
    cancelToken: tokens[url].token,
    ...config,
  })
}

// export const get = (...args:any[]) => transform("get", ...args)
// export const post = (...args:any[]) => transform("post", ...args)
// export const put = (...args:any[]) => transform("put", ...args)
// export const patch = (...args:any[]) => transform("patch", ...args)
// export const del = (...args:any[]) => transform("delete", ...args)

// const api = Api("list", {
//   create: { route:"/create", method:"post", withCredentials: true },
//   get_user: { route:"/user/:id", method:"get", multiple: true },
//   get: { route:"/user/:id", method:"get" }
// })
// api.get(id)
// export default api

// route options
//  withCredentials, method, route, doclist, docless, raw

export const route = (method, route, withCredentials, doctype) => ({
  route,
  method,
  withCredentials,
  docless: doctype === 'docless',
  doclist: doctype === 'doclist',
  raw: doctype === 'raw',
})

export const Api = (table, routes) => {
  const route_obj = {}
  for (const name in routes) {
    const route_name = name.split('?')[0]
    const info = { method: 'get', route: '', ...routes[name] }
    route_obj[route_name] = (...args) => {
      // construct arguments
      const params = []
      let payload = {}
      for (const arg of args) {
        // payload
        if (typeof arg === 'object' && arg != null) payload = arg
        // route param
        else params.push(arg)
      }
      // construct route with parameters
      let p = 0
      if (!info.route) throw `No route given for '${table}.${route_name}'`
      const path = `${table}${info.route.replace(/:\w+/g, () =>
        encodeURIComponent(params[p++])
      )}`
      // make api call
      const options = { ...info }
      if (info.call) info.call(options, ...args)
      return (
        info.method === 'get'
          ? transform('get', path, payload, options)
          : transform(info.method, path, payload, options)
      )
        .then((res) =>
          info.res
            ? info.res(res)
            : info.docless
            ? res.data
            : info.doclist
            ? Array.isArray(res.data.docs)
              ? res.data.docs
              : []
            : info.raw
            ? res
            : res.data.doc || res.data.data
        )
        .then((res) => {
          notify(table)
          return res
        })
    }
  }

  // returns [res, update(payload)]
  const useRoute = (name) => {
    const route_name = name.split('?')[0]
    const [data, setData] = useState()
    const call = (...args) =>
      route_obj[route_name](...args).then((new_data) => {
        setData(new_data)
        return new_data
      })
    return [data, call, setData]
  }

  return {
    useRoute,
    useNotify: (fn, id) => useNotify(fn, table, id),
    routes: route_obj,
  }
}

export const MockRouter = (routes) => {
  const wrap = (fn) => {
    return (...args) => {
      return Promise.resolve(fn(...args))
    }
  }
  const wrapped_routes = {}
  Object.entries(routes).forEach(([key, fn]) => {
    wrapped_routes[key] = wrap(fn)
  })
  const useRoute = (route) => {
    const [data, setData] = useState()
    if (!wrapped_routes[route]) console.error(`No such mock route '${route}'`)
    const fn = wrap(wrapped_routes[route])
    const fetch = useCallback(
      (...args) => fn(...args).then(setData),
      [fn, route]
    )
    return [data, fetch]
  }
  return { ...wrapped_routes, useRoute }
}
