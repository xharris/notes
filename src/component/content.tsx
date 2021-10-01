import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bem, css } from 'ui'
import { useAppContext } from './context'
import {
  createEditor,
  BaseEditor,
  Descendant,
  Transforms,
  Text,
  Editor,
  NodeMatch,
  Node as SlateNode,
  Element,
} from 'slate'
import {
  Slate,
  Editable,
  withReact,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
} from 'slate-react'
import { withHistory } from 'slate-history'
import isHotkey from 'is-hotkey'
import 'style/content.scss'
import { Button } from 'ui/react'

const style = bem('content')

type Content = {
  cardid: string
  defaultValue: string
  readOnly?: boolean
}

type CustomElement = {
  type:
    | 'paragraph'
    | 'bulleted-list'
    | 'list-item'
    | 'heading-one'
    | 'heading-two'
  children: CustomText[]
  bold?: boolean
}
type CustomText = {
  text: string
  bold?: boolean
  underline?: boolean
  code?: boolean
}
type ContentEditor = BaseEditor &
  ReactEditor & {
    bold?: boolean
  }

declare module 'slate' {
  interface CustomTypes {
    Editor: ContentEditor
    Element: CustomElement
    Text: CustomText
  }
}

type MarkFormat = keyof Omit<CustomText, 'text'>
type BlockFormat = CustomElement['type']

const LIST_TYPES = ['bulleted-list' /* 'bulleted-list' */]
const HOTKEYS: { [key: string]: MarkFormat } = {
  'mod+b': 'bold',
  'mod+u': 'underline',
}

const Block = ({ attributes, element, children }: RenderElementProps) => {
  switch (element.type) {
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>
    default:
      return (
        <p {...attributes} style={{ margin: 0 }}>
          {children}
        </p>
      )
  }
}

const Leaf = ({ attributes, leaf, children }: RenderLeafProps) => {
  if (leaf.bold) children = <strong>{children}</strong>
  if (leaf.underline) children = <u>{children}</u>
  if (leaf.code) children = <code>{children}</code>

  return (
    <span
      {...attributes}
      style={{
        fontSize: '0.8rem',
        lineHeight: '0.2rem',
      }}
    >
      {children}
    </span>
  )
}

const CustomEditor = {
  isMarkActive(editor: ContentEditor, format: MarkFormat) {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
  },
  isBlockActive(editor: ContentEditor, format: BlockFormat) {
    const [match] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === format,
    })
    return !!match
  },
  toggleMark(editor: ContentEditor, format: MarkFormat) {
    const isActive = CustomEditor.isMarkActive(editor, format)
    if (isActive) Editor.removeMark(editor, format)
    else Editor.addMark(editor, format, true)
  },
  toggleBlock(editor: ContentEditor, format: BlockFormat) {
    const isActive = CustomEditor.isBlockActive(editor, format)
    const isList = LIST_TYPES.includes(format)

    Transforms.unwrapNodes(editor, {
      match: (n) =>
        LIST_TYPES.includes(
          !Editor.isEditor(n) && Element.isElement(n) && n.type
        ),
      split: true,
    })

    const newProps: Partial<Element> = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    }
    Transforms.setNodes(editor, newProps)

    if (!isActive && isList) {
      const block: CustomElement = { type: format, children: [] }
      Transforms.wrapNodes(editor, block)
    }
  },
}

const MarkButton = ({ format, icon }: { format: MarkFormat; icon: string }) => {
  const editor = useSlate()
  return (
    <Button
      className={css({
        opacity: CustomEditor.isMarkActive(editor, format) ? 1 : 0.5,
      })}
      icon={icon}
      onMouseDown={(e) => {
        CustomEditor.toggleMark(editor, format)
        e.preventDefault()
      }}
    />
  )
}

const BlockButton = ({
  format,
  icon,
}: {
  format: BlockFormat
  icon: string
}) => {
  const editor = useSlate()
  return (
    <Button
      className={css({
        opacity: CustomEditor.isBlockActive(editor, format) ? 1 : 0.5,
      })}
      icon={icon}
      onMouseDown={(e) => {
        CustomEditor.toggleBlock(editor, format)
        e.preventDefault()
      }}
    />
  )
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
    () => withHistory(withReact(createEditor() as ReactEditor)),
    [cardid]
  )
  const renderElement = useCallback(
    (props: RenderElementProps) => <Block {...props} />,
    []
  )
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />
  }, [])

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(v) => {
        setValue(v)
        update('card', cardid, {
          content: JSON.stringify(v),
          textContent: v.map((n) => SlateNode.string(n)).join('\n'),
        })
      }}
    >
      <div className={style({ readOnly })}>
        <Editable
          autoFocus
          spellCheck
          readOnly={readOnly}
          className={style('editable')}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={(e) => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, e as any)) {
                e.preventDefault()
                CustomEditor.toggleMark(editor, HOTKEYS[hotkey])
              }
            }
          }}
        />
        {!readOnly && (
          <div className={style('tools')}>
            <MarkButton icon="bold" format="bold" />
            <MarkButton icon="underline" format="underline" />
            <BlockButton icon="list" format="bulleted-list" />
          </div>
        )}
      </div>
    </Slate>
  )
}
