import React, {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { bem, capitalize, css, cx, ObjectAny } from 'ui'
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
  useSelected,
  useFocused,
} from 'slate-react'
import { withHistory } from 'slate-history'
import isHotkey from 'is-hotkey'
import 'style/content.scss'
import { Button } from 'ui/react'
import { useFocusContext } from './focuscontext'
import { jsx } from 'slate-hyperscript'
import EditList from 'slate-edit-list'

const style = bem('content')

type Content = {
  cardid: string
  defaultValue: string
  readOnly?: boolean
}

type CustomElement = {
  type:
    | 'image'
    | 'paragraph'
    | 'link'
    | 'unordered-list'
    | 'ordered-list'
    | 'list-item'
    | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'heading-4'
    | 'heading-5'
    | 'heading-6'
  children: CustomText[]
  url?: string
}
type CustomText = {
  text: string
  bold?: boolean
  underline?: boolean
  code?: boolean
  italic?: boolean
  strikethrough?: boolean
}
type ContentEditor = BaseEditor & ReactEditor

declare module 'slate' {
  interface CustomTypes {
    Editor: ContentEditor
    Element: CustomElement
    Text: CustomText
  }
}

type MarkFormat = keyof Omit<CustomText, 'text'>
type BlockFormat = CustomElement['type']

const LIST_TYPES = ['unordered-list', 'ordered-list']
const MARK_HOTKEYS: { [key: string]: MarkFormat } = {
  'mod+b': 'bold',
  'mod+u': 'underline',
  'mod+i': 'italic',
  'alt+s': 'strikethrough',
}
const BLOCK_HOTKEYS: { [key: string]: BlockFormat } = {
  'mod+0': 'paragraph',
  'mod+1': 'heading-1',
  'mod+2': 'heading-2',
  'mod+3': 'heading-3',
  'mod+4': 'heading-4',
  'mod+5': 'heading-5',
  'mod+6': 'heading-6',
}

const Block = ({ attributes, element, children }: RenderElementProps) => {
  const selected = useSelected()
  const focused = useFocused()

  switch (element.type) {
    case 'image':
      return (
        <img
          src={element.url}
          className={css`
            display: block;
            max-width: 100%;
            max-height: 20em;
            box-shadow: ${selected && focused ? '0 0 0 2px blue;' : 'none'};
          `}
        />
      )
    case 'link':
      return <a {...attributes}>{children}</a>
    case 'unordered-list':
      return <ul {...attributes}>{children}</ul>
    case 'ordered-list':
      return <ol {...attributes}>{children}</ol>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'heading-1':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-2':
      return <h2 {...attributes}>{children}</h2>
    case 'heading-3':
      return <h3 {...attributes}>{children}</h3>
    case 'heading-4':
      return <h4 {...attributes}>{children}</h4>
    case 'heading-5':
      return <h5 {...attributes}>{children}</h5>
    case 'heading-6':
      return <h6 {...attributes}>{children}</h6>
    default:
      return (
        <p {...attributes} style={{ margin: 0 }}>
          {children}
        </p>
      )
  }
}

const Leaf = ({ attributes, leaf, children }: RenderLeafProps) => {
  if (leaf.code) children = <code>{children}</code>

  return (
    <span
      {...attributes}
      style={{
        fontWeight: leaf.bold ? 700 : null,
        textDecoration: [
          leaf.underline ? 'underline' : null,
          leaf.strikethrough ? 'line-through' : null,
        ].join(' '),
        fontStyle: leaf.italic ? 'italic' : null,
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
  isBlockActive(editor: ContentEditor, format: BlockFormat | string | RegExp) {
    const [match] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        n.type.match(format) != null,
    })
    return !!match
  },
  getCursorBlock(editor: ContentEditor, format: BlockFormat | string | RegExp) {
    const [match] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        n.type.match(format) != null,
    })
    return match as CustomElement[]
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
  setBlock(editor: ContentEditor, format: BlockFormat) {
    Transforms.setNodes(editor, { type: format })
  },
  removeBlock(editor: ContentEditor) {
    Transforms.unwrapNodes(editor, {
      match: (n) =>
        LIST_TYPES.includes(
          !Editor.isEditor(n) && Element.isElement(n) && n.type
        ),
      split: true,
    })
    Transforms.setNodes(editor, { type: 'paragraph' })
  },
}

const MarkButton = ({
  library,
  format,
  icon,
}: {
  library?: string
  format: MarkFormat
  icon: string
}) => {
  const editor = useSlate()
  return (
    <Button
      className={style('ctrl-btn', {
        enabled: CustomEditor.isMarkActive(editor, format),
      })}
      icon={icon}
      library={library}
      title={format
        .split('-')
        .map((f) => capitalize(f))
        .join(' ')}
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
  library,
}: {
  library?: string
  format: BlockFormat
  icon: string
}) => {
  const editor = useSlate()
  return (
    <Button
      className={style('ctrl-btn', {
        enabled: CustomEditor.isBlockActive(editor, format),
      })}
      icon={icon}
      library={library}
      title={format
        .split('-')
        .map((f) => capitalize(f))
        .join(' ')}
      onMouseDown={(e) => {
        CustomEditor.toggleBlock(editor, format)
        e.preventDefault()
      }}
    />
  )
}

const HeadingButton = () => {
  const editor = useSlate()
  const block = CustomEditor.getCursorBlock(editor, 'heading-')

  return (
    <Button
      className={cx(
        style('ctrl-btn', {
          enabled: CustomEditor.isBlockActive(editor, 'heading-'),
        }),
        css({
          position: 'relative',
          '& p': {
            position: 'absolute',
            right: -2,
            bottom: -2,
          },
        })
      )}
      icon="heading"
      text={block ? block[0].type.split('-')[1] : null}
      library="box"
      title={block ? `Heading ${block[0].type.split('-')[1]}` : 'Paragraph'}
      onMouseDown={(e) => {
        if (!block) {
          CustomEditor.setBlock(editor, 'heading-1')
          return e.preventDefault()
        }
        let b = parseInt(block[0].type.split('-')[1])
        b = Math.max(
          Math.min(b + (e.buttons === 1 ? 1 : e.buttons === 2 ? -1 : 0), 6),
          0
        )
        const format: BlockFormat =
          b === 0 ? 'paragraph' : `heading-${b as 1 | 2 | 3 | 4 | 5 | 6}`
        CustomEditor.setBlock(editor, format)
        e.preventDefault()
      }}
    />
  )
}

const ELEMENT_TAGS: {
  [key: string]: (e?: HTMLElement) => { type: BlockFormat } & ObjectAny
} = {
  a: (el) => ({ type: 'link', url: el.getAttribute('href') }),
  img: (el) => ({ type: 'image', url: el.getAttribute('src') }),
  h1: () => ({ type: 'heading-1' }),
  h2: () => ({ type: 'heading-2' }),
  h3: () => ({ type: 'heading-3' }),
  h4: () => ({ type: 'heading-4' }),
  h5: () => ({ type: 'heading-5' }),
  h6: () => ({ type: 'heading-6' }),
  li: () => ({ type: 'list-item' }),
  ul: () => ({ type: 'unordered-list' }),
  ol: () => ({ type: 'ordered-list' }),
  p: () => ({ type: 'paragraph' }),
}

const TEXT_TAGS: {
  [key: string]: (
    e?: HTMLElement
  ) => { [key in MarkFormat]?: boolean } & ObjectAny
} = {
  i: () => ({ italic: true }),
  em: () => ({ italic: true }),
  s: () => ({ strikethrough: true }),
  del: () => ({ strikethrough: true }),
  strong: () => ({ bold: true }),
  u: () => ({ underline: true }),
  code: () => ({ code: true }),
}

const deserialize = (el: HTMLElement): any => {
  let nodeName = el.nodeName.toLowerCase()

  if (el.nodeType === 1) {
    if (nodeName === 'span' && parseInt(el.style.fontWeight) >= 700)
      nodeName = 'strong'
    if (nodeName === 'span' && el.style.fontStyle === 'italic') nodeName = 'em'
    if (nodeName === 'span' && el.style.textDecoration.includes('underline'))
      nodeName = 'u'
    if (nodeName === 'span' && el.style.textDecoration.includes('line-through'))
      nodeName = 's'
  }

  if (el.nodeType === 3) {
    return el.textContent
  } else if (el.nodeType !== 1) {
    return null
  }

  let parent: HTMLElement | ChildNode = el

  if (
    nodeName === 'pre' &&
    el.childNodes[0] &&
    el.childNodes[0].nodeName === 'code'
  ) {
    parent = el.childNodes[0]
  }

  const children = Array.from(parent.childNodes).map(deserialize).flat()

  if (nodeName === 'body') return jsx('fragment', {}, children)

  if (nodeName === 'br')
    return jsx('element', { type: 'paragraph' }, [{ text: '' }])

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el)
    // if (nodeName === 'ul' || nodeName === 'ol') {
    //   return jsx('element', attrs, children.map(child => ))
    // }
    return jsx('element', attrs, children)
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName](el)
    return children.map((child) => jsx('text', attrs, child))
  }

  return children
}

const withHTML = (editor: ContentEditor) => {
  const { insertData, isInline, isVoid } = editor

  editor.isInline = (e) => (e.type === 'link' ? true : isInline(e))
  editor.isVoid = (element) =>
    element.type === 'image' ? true : isVoid(element)

  const wrapTopLevelInlineNodesInParagraphs = (
    editor: ContentEditor,
    fragment: HTMLElement[]
  ): any => {
    let inlineNodes: HTMLElement[] = []
    const newFragments: any[] = []

    const maybePushInlineNodeParagraph = () => {
      if (inlineNodes.length > 0) {
        newFragments.push(jsx('element', { type: 'paragraph' }, inlineNodes))
        inlineNodes = []
      }
    }

    fragment.forEach((node) => {
      if (Text.isText(node) || Editor.isInline(editor, node)) {
        inlineNodes.push(node)
      } else {
        maybePushInlineNodeParagraph()
        newFragments.push(node)
      }
    })
    maybePushInlineNodeParagraph()

    return newFragments
  }

  editor.insertData = (data) => {
    const html = data.getData('text/html')

    if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      const fragment: any = deserialize(parsed.body)
      let fragmentWithOnlyBlocks = fragment
      if (Array.isArray(fragment)) {
        console.log(fragment)
        // remove leading/trailing newlines
        if (fragment.length > 1) {
          if (fragment[0].text.replaceAll('\n', '').length === 0)
            fragment.splice(0, 1)
          if (
            fragment[fragment.length - 1].text.replaceAll('\n', '').length === 0
          )
            fragment.splice(fragment.length - 1, 1)
        }
        // fragmentWithOnlyBlocks = wrapTopLevelInlineNodesInParagraphs(
        //   editor,
        //   fragment
        // )
      }
      Transforms.insertFragment(editor, fragmentWithOnlyBlocks)
      return
    }

    insertData(data)
  }

  return editor
}

export const Content = ({ cardid, defaultValue, readOnly }: Content) => {
  let jsonData: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]
  try {
    const defData = JSON.parse(defaultValue)
    if (Array.isArray(jsonData)) jsonData = defData
  } catch (e) {}
  const { requestFocus, stopFocus } = useFocusContext()
  const { update } = useAppContext()
  const [value, setValue] = useState<Descendant[]>(jsonData)
  const editor = useMemo(
    () => withHTML(withHistory(withReact(createEditor() as ReactEditor))),
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
      <div className={cx(style({ readOnly }), css({ tabSize: 4 }))}>
        <Editable
          autoFocus
          spellCheck
          readOnly={readOnly}
          className={style('editable')}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onPaste={(e) => {
            console.log(e)
          }}
          onKeyDown={(e) => {
            for (const hotkey in MARK_HOTKEYS) {
              if (isHotkey(hotkey, e as any)) {
                e.preventDefault()
                CustomEditor.toggleMark(editor, MARK_HOTKEYS[hotkey])
              }
            }
            for (const hotkey in BLOCK_HOTKEYS) {
              if (isHotkey(hotkey, e as any)) {
                e.preventDefault()
                CustomEditor.toggleBlock(editor, BLOCK_HOTKEYS[hotkey])
              }
            }
            requestFocus()
            if (e.key === 'Tab') {
              e.preventDefault()
              editor.insertText('\t')
            }
          }}
        />
        {!readOnly && (
          <div className={style('tools')}>
            <HeadingButton />
            <MarkButton icon="bold" format="bold" />
            <MarkButton icon="italic" format="italic" />
            <MarkButton icon="underline" format="underline" />
            <MarkButton
              icon="strikethrough-s"
              format="strikethrough"
              library="material"
            />
            <BlockButton
              icon="format-list-numbered"
              library="material"
              format="ordered-list"
            />
            <BlockButton icon="list" format="unordered-list" />
          </div>
        )}
      </div>
    </Slate>
  )
}
