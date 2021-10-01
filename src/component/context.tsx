import { nanoid } from 'nanoid'
import React, {
  ComponentProps,
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react'
import { ObjectAny } from 'ui'
import { matchesSelector } from 'pouchdb-selector-core'
import { Dexie, IndexableType } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  NON_INDEXED_FIELDS,
  applyEncryptionMiddleware,
  clearAllTables,
} from 'dexie-encrypted'

const AppContext = createContext<{
  loaded: boolean
  db?: NotesDatabase
  create?: <T>(collection: Collections, data?: T) => Promise<unknown>
  update?: <T>(collection: Collections, id: string, data?: T) => void
  useQuery?: <T>(querier: () => Promise<T>, dependencies?: any[]) => T
}>({ loaded: false })

class NotesDatabase extends Dexie {
  card: Dexie.Table<Card, string>
  tag: Dexie.Table<Tag, string>

  constructor() {
    super('notes')
    this.version(1).stores({
      card: '_id',
      section: '_id',
      tag: '_id',
    })
    this.version(2).stores({
      section: null,
    })

    this.card = this.table('card')
    this.tag = this.table('tag')
  }
}

export const AppContextProvider = (props: { children: ReactNode }) => {
  const [db, setDb] = useState<NotesDatabase>()

  useEffect(() => {
    const newdb = new NotesDatabase()
    // generate the correct length key (32)
    let key = process.env.REACT_KEY
    let i = 1
    let len = key.length
    while (new TextEncoder().encode(key).length < 32) {
      key += key[(i++ % len) - 1]
    }
    applyEncryptionMiddleware(
      newdb,
      new TextEncoder().encode(key),
      {
        card: NON_INDEXED_FIELDS,
        tag: NON_INDEXED_FIELDS,
      },
      (db) => clearAllTables(db)
    )

    setDb(newdb)
  }, [])

  return (
    <AppContext.Provider
      {...props}
      value={{
        loaded: db != null,
        db,
        create: useCallback(
          (collection, data) => {
            if (db)
              return db.table(collection).add({
                ...(collection === 'section'
                  ? { title: '' }
                  : collection === 'card'
                  ? { title: '', content: '', tags: [] }
                  : collection === 'tag'
                  ? { value: '', color: 'blue_grey' }
                  : {}),
                ...data,
                _id: nanoid(),
              }) as Promise<unknown>
            return Promise.reject()
          },
          [db]
        ),
        update: useCallback(
          (collection, id, data) => {
            if (db) db.table(collection).where({ _id: id }).modify(data)
          },
          [db]
        ),
        useQuery: <T,>(querier: () => Promise<T>, dependencies?: any[]) =>
          useLiveQuery(querier, dependencies),
      }}
    />
  )
}

export const useAppContext = () => useContext(AppContext)
