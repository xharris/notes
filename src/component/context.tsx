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
import PouchDB from 'pouchdb'
import PouchFindDB from 'pouchdb-find'
import { matchesSelector } from 'pouchdb-selector-core'
import { Dexie, IndexableType } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'

PouchDB.plugin(PouchFindDB)

const AppContext = createContext<{
  loaded: boolean
  db?: Dexie
  create?: <T>(collection: Collections, data?: T) => Promise<unknown>
  update?: <T>(collection: Collections, id: string, data?: T) => void
  useQuery?: <T>(querier: () => Promise<T>, dependencies?: any[]) => T
}>({ loaded: false })

export const AppContextProvider = (props: { children: ReactNode }) => {
  const [db, setDb] = useState<Dexie>()
  const [changes, setChanges] =
    useState<PouchDB.Core.Changes<Card | Section | Tag>>()

  useEffect(() => {
    const newdb = new Dexie('notes')
    newdb.version(1).stores({
      card: '_id',
      section: '_id',
      tag: '_id',
    })
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
                  ? { title: '', sections: [], tags: [] }
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
