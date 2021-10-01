import React, {
  ComponentProps,
  useState,
  useEffect,
  createContext,
} from 'react'
import { arrayMove, bem, css } from 'ui'
import 'style/skeleton.scss'
import 'style/app.scss'
import 'style/ui.scss'
import { TagEditor } from './tageditor'
import { Page } from './page'
import { AppContextProvider, useAppContext } from './context'
import { Button } from 'ui/react'
import { DragDropContext } from 'react-beautiful-dnd'
import { Electron } from 'ui/electron'

const style = bem('app')

const AppBody = () => {
  const { db, update, useQuery } = useAppContext()
  const [showTagEditor, setShowTagEditor] = useState(false)
  const [editing, setEditing] = useState<string>()

  // const settings = useQuery(() => db && db.table('settings'))

  return (
    <DragDropContext
      onDragEnd={(res) => {
        const [type, id] = res.draggableId.split('|')
        const is = (
          draggable: string,
          dropSrc: string | RegExp,
          dropDest?: string | RegExp
        ) =>
          type === draggable &&
          (!dropDest || res.source.droppableId.match(dropSrc)) &&
          res.destination &&
          res.destination.droppableId.match(dropDest || dropSrc)

        // reorderering tags
        if (is('tag', 'tag-container')) {
          db.table('tag')
            .toArray()
            .then((docs) => {
              docs.sort((a, b) => a.index - b.index)
              arrayMove(docs, res.source.index, res.destination.index)
              docs = docs.map((d, i) => {
                d.index = i
                return d
              })
              db.table('tag').bulkPut(docs)
            })
        }

        // add tag to card
        if (is('tag', /card\|.*/)) {
          const [_, cardid] = res.destination.droppableId.split('|')
          console.log(id, '>', cardid)
          db.table('card')
            .where('_id')
            .equals(cardid)
            .modify((doc: Card) => {
              doc.tags = [...doc.tags.filter((t) => t !== id), id]
            })
        }
      }}
    >
      <div className={style({ editing: !!editing })}>
        {/* <Nav /> */}
        <div className={style('nav')}>
          {process.env.REACT_ELECTRON && (
            <div className={style('titlebar')}>
              <div className={style('tbar-left')}></div>
              <div className={style('tbar-right')}>
                <Button
                  icon="minus"
                  onClick={() => Electron.send('minimize')}
                />
                <Button
                  icon="square"
                  onClick={() => Electron.send('toggle-maximize')}
                />
                <Button icon="x" onClick={() => Electron.send('close')} />
              </div>
            </div>
          )}
          <div className={style('controls')}>
            <Button
              icon="hash"
              className={css({
                border: `1px solid ${
                  showTagEditor ? '#BDBDBD' : 'transparent'
                }`,
              })}
              onClick={() => setShowTagEditor(!showTagEditor)}
              round
            />
            {editing && (
              <Button icon="x" onClick={() => setEditing(null)} round />
            )}
          </div>
        </div>
        <div className={style('content')}>
          {showTagEditor && <TagEditor />}
          <Page editing={editing} onEditCard={setEditing} />
        </div>
      </div>
    </DragDropContext>
  )
}

// context providers here
export const App = () => (
  <AppContextProvider>
    <AppBody />
  </AppContextProvider>
)
