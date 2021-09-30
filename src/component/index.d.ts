declare module 'brick.js'
declare module 'react-pouchdb'
declare module 'pouchdb-selector-core'

type Collections = 'card' | 'section' | 'tag'

type DBDoc = {
  _id: string
  _rev?: string
}

type Section = DBDoc & {
  [key: string]: any
} & {
  title: string
  type: string
  update?: <T>(data: Partial<T>) => void
}

type Card = DBDoc & {
  title: string
  sections: ObjectAny[]
  tags: string[]
}

type Tag = DBDoc & {
  value?: string
  color?: string
  index: number
}

type Block = {
  name: string
  icon: string
  component: (...args: any[]) => JSX.Element
  preview: (...args: any[]) => JSX.Element
  template?: ObjectAny
}
