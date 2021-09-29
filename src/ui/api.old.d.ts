type ApiRoute = {
  route: string
  method: 'get' | 'post' | 'put' | 'delete'
  withCredentials?: boolean
  docless?: boolean
  doclist?: boolean
  raw?: boolean
  headers?: { [key: string]: any }
}
type ApiCall = (...args: any[]) => Promise<any>

export declare function route(
  method: 'get' | 'post' | 'put' | 'delete',
  route: string,
  withCredentials?: boolean,
  doctype?: 'docless' | 'doclist' | 'raw'
): ApiRoute

export declare function Api<T extends { [key: string]: ApiRoute }>(
  name: string,
  routes: T
): {
  [key: keyof typeof T]: ApiCall
} & {
  useRoute: <T>(name: any) => [T, ApiCall]
  useNotify: (fn: any, id: any) => void
  routes: {
    [key: keyof typeof T]: ApiCall
  }
}

export declare function isCancel(value: any): boolean
