import React, { useEffect, useRef, useState } from 'react'
import { bem, color, colors, css, cx, ObjectAny } from 'ui'
import 'style/tageditor.scss'
import { useAppContext } from './context'
import { Button } from 'ui/react'
import { Tag } from './tag'
import { Form, Input } from 'ui/form'
import { Droppable, Draggable } from 'react-beautiful-dnd'

const style = bem('tageditor')

export const TagEditor = () => {
  const [editing, setEditing] = useState(false)
  const { db, create, useQuery } = useAppContext()
  const tags =
    useQuery<Tag[]>(() => db && db.table('tag').toArray(), [db]) || []

  useEffect(() => {
    if (tags.length === 0 && editing) setEditing(false)
  }, [tags, editing])

  return (
    <div className={style()}>
      <div className={style('controls')}>
        <Button
          icon="plus"
          onClick={() => {
            create('tag', { value: 'new tag', index: tags.length })
          }}
        />
        {tags.length > 0 && (
          <Button
            icon={editing ? 'check' : 'edit-2'}
            onClick={() => setEditing(!editing)}
          />
        )}
      </div>
      <Droppable droppableId="tag-container">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={style('tags', { editing })}
          >
            {tags
              .sort((a, b) => a.index - b.index)
              .map((tag, i) =>
                editing ? (
                  <Form
                    className={cx(
                      style('tag-form'),
                      css({
                        backgroundColor: color(tag.color, 'bg'),
                      })
                    )}
                    defaultValue={tag}
                    onChange={(e, name) => {
                      if (db)
                        db.table('tag')
                          .where({ _id: tag._id })
                          .modify({ [name]: e.currentTarget.value })
                    }}
                  >
                    <Button
                      className={style('tag-delete')}
                      icon="trash"
                      onClick={() => {
                        if (
                          db &&
                          window.confirm(
                            `Are you sure you want to delete tag '${tag.value}'?`
                          )
                        )
                          db.table('tag')
                            .delete(tag._id)
                            .then(() =>
                              db
                                .table('card')
                                .where('tags')
                                .equals(tag._id)
                                .modify((card) => {
                                  card.tags = card.tags.filter(
                                    (t: string) => t !== tag._id
                                  )
                                })
                            )
                      }}
                    />
                    <Input name="value" type="text" />
                    <Input name="color" type="color" colors="bg" />
                  </Form>
                ) : (
                  <Draggable
                    key={tag._id}
                    draggableId={`tag|${tag._id}`}
                    index={i}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        style={provided.draggableProps.style}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Tag value={tag.value} color={tag.color} />
                      </div>
                    )}
                  </Draggable>
                )
              )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
