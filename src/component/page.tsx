import React from 'react'
import { bem, css, ObjectAny } from 'ui'
import 'style/page.scss'
import { Card } from './card'
import { useAppContext } from './context'
import { Button } from 'ui/react'
import { Grid } from './grid'
// import Bricks from 'brick.js'
// import Masonry from 'react-masonry-css'

type Page = {
  editing?: string
  onEditCard?: (id?: string) => void
}

const style = bem('page')

export const Page = ({ editing, onEditCard }: Page) => {
  const { db, create, useQuery } = useAppContext()
  const cards = useQuery<Card[]>(() => db && db.table('card').toArray(), [db])
  // const [bricks, setBricks] = useState()
  // const el_cards = useRef()

  // useEffect(() => {
  //   if (!editing && el_cards.current) {
  //     if (!bricks) {
  //       setBricks(
  //         Bricks({
  //           contained: el_cards.current,
  //         })
  //       )
  //     }
  //   } else {
  //     if (bricks) {
  //       setBricks(null)
  //     }
  //   }
  // }, [bricks, editing, el_cards])

  return (
    <div className={style()}>
      {cards && editing ? (
        <div className={style('cards')}>
          <Card
            _id={editing}
            editing={!!editing}
            onClose={() => {
              if (onEditCard) onEditCard(null)
            }}
          />
        </div>
      ) : (
        <Grid className={style('masonry')} width={200}>
          {cards &&
            cards.map((c) => (
              <Card
                key={c._id}
                _id={c._id}
                editing={editing && editing === c._id}
                onEdit={() => {
                  if (onEditCard) onEditCard(c._id)
                }}
                onClose={() => {
                  if (onEditCard) onEditCard(null)
                }}
              />
            ))}
        </Grid>
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
