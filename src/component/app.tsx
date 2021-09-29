import React, {
  ComponentProps,
  useState,
  useEffect,
  createContext,
} from 'react'
import { bem, css } from 'ui'
import 'style/skeleton.scss'
import 'style/app.scss'
import 'style/ui.scss'
import { TagEditor } from './tageditor'
import { Page } from './page'
import { AppContextProvider, useAppContext } from './context'
import { Button } from 'ui/react'

const style = bem('app')

const AppBody = () => {
  const [showTagEditor, setShowTagEditor] = useState(true)

  return (
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
  )
}

// context providers here
export const App = () => (
  <AppContextProvider>
    <AppBody />
  </AppContextProvider>
)
