import React, {
  ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { bem, css, ObjectAny } from 'ui'
import 'style/page.scss'
import { Card } from './card'
import { useAppContext } from './context'
import { Button } from 'ui/react'
import Bricks from 'brick.js'

type Page = {}

const style = bem('page')

export const Page = ({}: Page) => {
  const { db, create, useQuery } = useAppContext()
  const [editing, setEditing] = useState<string>()
  const cards = useQuery<Card[]>(() => db && db.table('card').toArray(), [db])

  return (
    <div className={style()}>
      {cards && (
        <div className={style('cards')}>
          {editing ? (
            <Card
              _id={editing}
              editing={!!editing}
              onClose={() => {
                setEditing(null)
              }}
            />
          ) : (
            cards &&
            cards.map((c) => (
              <Card
                _id={c._id}
                editing={editing && editing === c._id}
                onEdit={() => {
                  setEditing(c._id)
                }}
                onClose={() => {
                  setEditing(null)
                }}
              />
            ))
          )}
        </div>
      )}
      {!editing && (
        <Button
          className={style('addcard-btn')}
          icon="plus"
          round
          onClick={() => create('card')}
        />
      )}
    </div>
  )
}
