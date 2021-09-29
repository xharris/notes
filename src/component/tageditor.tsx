import React, { useEffect, useRef, useState } from 'react'
import { bem, color, colors, css, cx, ObjectAny } from 'ui'
import 'style/tageditor.scss'
import { useAppContext } from './context'
import { Button } from 'ui/react'
import { Tag } from './tag'
import { Form, Input } from 'ui/form'

const style = bem('tageditor')

export const TagEditor = () => {
  const [editing, setEditing] = useState(false)
  const { db, create, useQuery } = useAppContext()
  const tags =
    useQuery<Tag[]>(() => db && db.table('tag').toArray(), [db]) || []

  return (
    <div className={style()}>
      <div className={style('controls')}>
        <Button
          icon="plus"
          onClick={() => {
            create('tag', { value: 'new tag' })
          }}
        />
        <Button
          icon={editing ? 'check' : 'edit-2'}
          onClick={() => setEditing(!editing)}
        />
      </div>
      <div className={style('tags', { editing })}>
        {tags.map((tag) =>
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
                    db.table('tag').delete(tag._id)
                }}
              />
              <Input name="value" type="text" />
              <Input name="color" type="color" colors="bg" />
            </Form>
          ) : (
            <Tag
              value={tag.value}
              color={tag.color}
              draggable={{ _collection: 'tag', ...tag }}
            />
          )
        )}
      </div>
    </div>
  )
}
