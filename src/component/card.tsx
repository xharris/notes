import React, { useCallback, useEffect, useRef, useState } from 'react'
import { bem, css, ObjectAny } from 'ui'
import 'style/card.scss'
import { Button, Dialog, Icon } from 'ui/react'

import Tasklist from './cards/tasklist'
import { nanoid } from 'nanoid'
import { useAppContext } from './context'
import { Tag } from './tag'

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
  const { loaded, db, useQuery, create, update } = useAppContext()
  const [showSectionDialog, setShowSectionDialog] = useState(false)
  const [blocks, setBlocks] = useState<ObjectAny<Block>>({})

  const doc = useQuery<Card>(() => db && db.table('card').get(_id), [db, _id])
  const doctags =
    useQuery<Tag[]>(
      () => db && doc && db.table('tag').where('_id').anyOf(doc.tags).toArray(),
      [db, doc]
    ) || []

  const sections =
    useQuery<Section[]>(
      () =>
        db &&
        doc &&
        db
          .table('section')
          .where('_id')
          .anyOf(...(doc.sections || []))
          .toArray(),
      [db, doc]
    ) || []

  const updateSection = useCallback(
    (data: Partial<Section> & DBDoc) => {
      if (db) {
        db.table('section').where({ _id: data._id }).modify(data)
      }
    },
    [db]
  )

  useEffect(() => {
    // add built-in blocks
    ;[Tasklist].forEach((block) => {
      setBlocks((prev) => ({
        ...prev,
        [block.name]: {
          ...block,
        },
      }))
    })

    // load block plugins
    // Promise.all(
    //   ['./src/component/cards/tasklist.tsx'].map((b) =>
    //     import(/* webpackIgnore: true */ b).then((mod) => {
    //       setBlocks((prev) => ({
    //         ...prev,
    //         [mod.name]: {
    //           ...mod,
    //         },
    //       }))
    //     })
    //   )
    // ).then(() => setLoaded(true))
  }, [])

  if (!doc) return null

  return (
    <div
      className={style({ editing, nosections: sections.length === 0 })}
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDrop={(e) => {
        const tdoc = JSON.parse(e.dataTransfer.getData('text/plain') || '')
        if (tdoc && tdoc._collection === 'tag') {
          console.log(tdoc)
          update('card', _id, {
            tags: [...doc.tags.filter((t) => t !== tdoc._id), tdoc._id],
          })
        }
      }}
    >
      <div className={style('content')}>
        {editing ? (
          <input
            placeholder="Title"
            className={style('title')}
            onChange={(e) =>
              db &&
              db.table('card').where({ _id }).modify({ title: e.target.value })
            }
            defaultValue={doc.title}
          />
        ) : (
          doc.title &&
          doc.title.length > 0 && <p className={style('title')}>{doc.title}</p>
        )}
        <div className={style('sections')}>
          {sections.map((sec) => {
            if (sec.type in blocks) {
              const SectionComponent = editing
                ? blocks[sec.type].component
                : blocks[sec.type].preview
              return (
                <div className={style('section')}>
                  {editing ? (
                    <input
                      placeholder="Subtitle"
                      className={style('subtitle')}
                      defaultValue={sec.title}
                      onChange={(e) =>
                        updateSection({
                          ...sec,
                          _id: sec._id,
                          title: e.currentTarget.value,
                        })
                      }
                    />
                  ) : (
                    sec.title &&
                    sec.title.length > 0 && (
                      <p className={style('subtitle')}>{sec.title}</p>
                    )
                  )}
                  <SectionComponent {...sec} update={updateSection} />
                </div>
              )
            }
          })}
        </div>
        {doc.tags.length > 0 && (
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
        )}
        {editing && (
          <div className={style('footer')}>
            <div>{/* filler */}</div>
            {editing && (
              <Button
                className={style('add-btn')}
                icon="plus"
                onClick={() => setShowSectionDialog(true)}
              />
            )}
          </div>
        )}
      </div>
      <div className={style('corner-buttons')}>
        {!editing && (
          <Button
            icon="trash"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this card?'))
                db.table('card').delete(_id)
            }}
            round
          />
        )}
        <Button
          icon={editing ? 'x' : 'edit-2'}
          onClick={() => (editing ? onClose() : onEdit())}
          round
        />
      </div>
      <Dialog
        open={showSectionDialog}
        onClose={() => setShowSectionDialog(false)}
      >
        <div className={style('dlg-choices')}>
          {Object.values(blocks).map((block) => (
            <Button
              icon={block.icon}
              text={block.name}
              onClick={() => {
                create('section', {
                  ...block.template,
                  type: block.name,
                }).then((secid) => {
                  update('card', _id, {
                    sections: [...doc.sections, secid],
                  })
                  setShowSectionDialog(false)
                })
              }}
            />
          ))}
        </div>
      </Dialog>
    </div>
  )
}
