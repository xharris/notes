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

const style = bem('app')

const AppBody = () => {
  const { db, update } = useAppContext()
  const [showTagEditor, setShowTagEditor] = useState(true)

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
      <div className={style()}>
        {/* <Nav /> */}
        <div className={style('nav')}>
          <Button
            icon="hash"
            className={css({
              border: `1px solid ${showTagEditor ? '#BDBDBD' : 'transparent'}`,
            })}
            onClick={() => setShowTagEditor(!showTagEditor)}
          />
        </div>
        <div className={style('content')}>
          {showTagEditor && <TagEditor />}
          <Page />
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
