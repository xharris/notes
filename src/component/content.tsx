import React, { useEffect, useMemo, useState } from 'react'
import { bem } from 'ui'
import { useAppContext } from './context'
import { createEditor, BaseEditor, Descendant } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import 'style/content.scss'

const style = bem('content')

type Content = {
  cardid: string
  defaultValue: string
  readOnly?: boolean
}

type CustomElement = { type: 'paragraph'; children: CustomText[] }
type CustomText = { text: string }

declare module 'slate' {
  interface CustomTypes {
    Edtior: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

export const Content = ({ cardid, defaultValue, readOnly }: Content) => {
  let jsonData: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]
  try {
    const defData = JSON.parse(defaultValue)
    if (Array.isArray(jsonData)) jsonData = defData
  } catch (e) {}

  const { update } = useAppContext()
  const [value, setValue] = useState<Descendant[]>(jsonData)
  const editor = useMemo(
    () => withReact(createEditor() as ReactEditor),
    [cardid]
  )

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(v) => {
        setValue(v)
        update('card', cardid, { content: JSON.stringify(v) })
      }}
    >
      <Editable
        readOnly={readOnly}
        className={style()}
        onKeyDown={(e) => {
          // if (!e.ctrlKey) {
          //   return
          // }
          // switch (e.key) {
          //   case:
          // }
        }}
      />
    </Slate>
  )
}
