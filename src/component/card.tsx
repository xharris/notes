import React, { useCallback, useEffect, useRef, useState } from 'react'
import { bem, css, ObjectAny } from 'ui'
import 'style/card.scss'
import { Button, Dialog, Icon } from 'ui/react'

import Tasklist from './cards/tasklist'
import { nanoid } from 'nanoid'
import { useAppContext } from './context'
import { Tag } from './tag'
import { Droppable } from 'react-beautiful-dnd'
import { Content } from './content'

const style = bem('card')

type CardComponent = {
  _id: string
  editing: boolean
  onClose?: () => void
  onEdit?: () => void
}

export const Card = ({
  _id,
  // sections: _sections,
  editing,
  onClose = () => null,
  onEdit = () => null,
}: CardComponent) => {
  const { db, useQuery, update } = useAppContext()

  const doc = useQuery<Card>(() => db && db.table('card').get(_id), [db, _id])
  const doctags =
    useQuery<Tag[]>(
      () => db && doc && db.table('tag').where('_id').anyOf(doc.tags).toArray(),
      [db, doc]
    ) || []

  if (!doc) return null

  const Tags = () =>
    doc.tags.length > 0 && (
      <div className={style('tags')}>
        {doctags.map((tag) => (
          <Tag
            value={tag.value}
            color={tag.color}
            onDelete={
              editing
                ? () => {
                    update('card', _id, {
                      tags: doc.tags.filter((t) => t !== tag._id),
                    })
                  }
                : null
            }
          />
        ))}
      </div>
    )

  return (
    <Droppable droppableId={`card|${_id}`}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={style({ editing })}
        >
          {editing && <Tags />}
          <div className={style('content')}>
            {/* {editing ? (
              <input
                placeholder="Title"
                className={style('title')}
                onChange={(e) =>
                  db &&
                  db
                    .table('card')
                    .where({ _id })
                    .modify({ title: e.target.value })
                }
                defaultValue={doc.title}
              />
            ) : (
              doc.title &&
              doc.title.length > 0 && (
                <p className={style('title')}>{doc.title}</p>
              )
            )} */}
            {/* <div className={style('content')}> */}
            <Content
              cardid={_id}
              defaultValue={doc.content}
              readOnly={!editing}
            />
            {/* </div> */}
            {!editing && <Tags />}
            {provided.placeholder}
          </div>
          <div className={style('corner-buttons')}>
            {!editing && (
              <Button
                icon="trash"
                onClick={() => {
                  if (
                    window.confirm('Are you sure you want to delete this card?')
                  )
                    db.table('card').delete(_id)
                }}
                round
              />
            )}
            {!editing && (
              <Button icon="edit-2" onClick={() => onEdit()} round />
            )}
          </div>
        </div>
      )}
    </Droppable>
  )
}
