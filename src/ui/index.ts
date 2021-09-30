/*

You only need 10 html tags:
h1 - h6     Header
p           Paragraph (only text)
i / em      Italic / Emphasis
b / strong  Bold / String
a           Anchor
ul / li     Unordered List & List Item
blockquote  Blockquote
hr          Horizontal Rule
img         Image
div         Division

*/
// yarn add @emotion/css @electron/remote tinycolor2
// yarn add -D @types/tinycolor2
import { css, cx } from '@emotion/css'
import tinycolor from 'tinycolor2'
import { generatePath } from 'react-router'

// CSS / Styling

type BemBlockModifiers = { [key: string]: any }
type BemBlockFn = (
  element?: string | BemBlockModifiers,
  modifiers?: BemBlockModifiers,
  excludeRoot?: boolean
) => string

// fg: 900, bg: 100
export const colors: { [key: string]: { [key: string]: string } } = {
  red: { fg: '#B71C1C', bg: '#FFCDD2' },
  light_blue: { fg: '#01579B', bg: '#B3E5FC' },
  blue_grey: { fg: '#37474F' /* 800 */, bg: '#CFD8DC' },
  teal: { fg: '#004D40', bg: '#B2DFDB' },
}

export const color = (c: string, shade?: string) =>
  shade && c in colors && shade in colors[c] ? colors[c][shade] : c

export const bem = (block?: string): BemBlockFn => {
  return (
    element?: string | BemBlockModifiers,
    modifiers?: BemBlockModifiers,
    excludeRoot?: boolean
  ): string => {
    if (typeof element !== 'string') {
      modifiers = element
      element = null
    }
    const classes = [
      !element ? block : `${block}__${element}`, // !element || element === block ? block : `${block}__${element}`,
      ...(modifiers
        ? Object.keys(modifiers)
            .map((m) => {
              if (typeof modifiers[m] === 'boolean' || modifiers[m] == null) {
                return modifiers[m] === true
                  ? element
                    ? `${block}__${element}--${m}`
                    : `${block}--${m}`
                  : null
              } else
                return element
                  ? `${block}__${element}--${m}-${modifiers[m]}`
                  : `${block}--${m}-${modifiers[m]}`
            })
            .filter((m) => m)
        : []),
    ]
    if (excludeRoot) classes.splice(0, 1)
    return cx(...classes)
  }
}

export const pickColor = (bg: tinycolor.ColorInput, amount?: number) => {
  const bg_color = tinycolor(bg)
  return bg_color.isLight()
    ? bg_color.darken(amount)
    : bg_color.brighten(amount)
}

export const css_popbox = (
  color: string,
  thickness = 2,
  only_hover = false,
  show_border = false
) => {
  const boxShadow = (c: string) =>
    new Array(thickness)
      .fill(0)
      .map((_, i) => `${i}px ${i}px ${c}`)
      .join(', ')
  const shadow_color = tinycolor(color).darken(25).toHexString()
  // const shadow = tinycolor(color).lighten(20).toHexString()
  const bg_color = tinycolor(color).brighten(10).toHexString()
  const text_color = tinycolor(color).isDark()
    ? tinycolor(color).brighten(50).toHexString()
    : tinycolor(color).darken(25).toHexString()
  return css`
    color: ${text_color};
    background-color: ${bg_color};
    border: ${Math.max(0, thickness - 2)}px solid
      ${show_border ? shadow_color : 'transparent'};
    border-radius: ${thickness}px;
    margin-right: ${thickness - 1}px;
    // box-sizing: border-box;
    box-shadow: ${thickness}px ${thickness}px 2px rgba(0, 0, 0, 0.2);

    ${only_hover ? '&:hover' : '&'} {
      box-shadow: ${thickness}px ${thickness}px 2px
        ${tinycolor(shadow_color).setAlpha(0.5).toRgbString()}; // ${boxShadow(
        shadow_color
      )} ;
      // border-color: ${color};
    }
  `
}

// Util

export type StringLike = string | number // | { [key:string]:any, toString: () => string }
export type Point = { x: number; y: number }
export type ObjectAny<T = any> = { [key: string]: T }
export type ValueOf<T> = T[keyof T]
export type GetLength<original extends any[]> = original extends {
  length: infer L
}
  ? L
  : never
// export type GetLast<original extends any[]> = original[Prev<GetLength<original>>]
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

declare global {
  interface ObjectConstructor {
    typedKeys<T>(obj: T): Array<keyof T>
  }
}
Object.typedKeys = Object.keys as any

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

type IObjectGet = <T = any>(obj?: ObjectAny | T, ...args: string[]) => T

export const ObjectGet: IObjectGet = (obj, ...args) => {
  obj = obj as ObjectAny
  if (obj != null && typeof obj === 'object' && args.length > 0)
    return ObjectGet(obj[args[0]], ...args.splice(1))
  return args.length === 0 ? obj : null
}

// export const ObjectVerify = (obj:ObjectAny, other:ObjectAny) =>
//   Object.keys(other)
//     .forEach(k => {
//       if (obj[k] && typeof other[k] === 'object')
//         ObjectVerify(obj[k], other[k])
//       else if (obj[k] == null) {
//         obj[k] = Object.assign() other
//       }
//     })

type IStringifyJson = (
  data: ObjectAny,
  options?: {
    language?: string
    equals?: string
    array?: [string, string]
    key?: {
      [key: string]: (key: string) => string
    }
    value?: {
      [key: string]: (key: string) => string
    }
    array_width?: ObjectAny<number>
  }
) => string

export const stringifyJSON: IStringifyJson = (data, options) => {
  if (options.language === 'lua') {
    options = {
      equals: '=',
      array: ['{', '}'],
      key: {
        number: (k) => `[${k}]`,
      },
      value: {
        string: (k) => `"${k}"`,
      },
      ...options,
    }
  }

  const {
    equals = ':',
    array = ['[', ']'],
    key = {},
    value = {},
    array_width = {},
  } = options

  const _stringify = (data: any, depth = 1, from = ''): string => {
    const indent = new Array(depth).fill('    ').join('')
    const indent_lessone = new Array(Math.max(0, depth - 1))
      .fill('    ')
      .join('')
    const type = typeof data
    const inline = !!array_width[from]
    const newline = inline ? ' ' : '\n'

    const next_from = (k: string) => (from.length > 0 ? `${from}.${k}` : k)

    switch (type) {
      case 'object':
        if (Array.isArray(data)) {
          if (data.length === 0) return `${array[0]}${array[1]}`
          else if (
            !array_width[from] &&
            data.some((d) => typeof d === 'object')
          ) {
            const arr = Object.values(data).map(
              (v, i) =>
                `${Array.isArray(data) && i !== 0 ? indent : ''}${_stringify(
                  v,
                  depth + 1,
                  from
                )}`
            )
            return `${array[0]}\n${indent}${arr.join(
              ',\n'
            )}\n${indent_lessone}${array[1]}`
          } else {
            const arr = Object.values(data).map((v) =>
              _stringify(v, typeof v === 'object' ? depth + 1 : 0, from)
            )
            let new_arr = []
            for (let i = 0, j = arr.length; i < j; i += array_width[from]) {
              new_arr.push(
                indent + arr.slice(i, i + array_width[from]).join(',')
              )
            }
            return `${array[0]}\n${new_arr.join(',\n')}\n${indent_lessone}${
              array[1]
            }`
          }
        } else if (Object.keys(data).length === 0) return '{}'
        else
          return `{${newline}${Object.entries(data)
            .filter(([_, v]) => v != undefined)
            .map(
              ([k, v]) =>
                `${inline ? '' : indent}${
                  key[typeof k] ? key[typeof k](k) : k
                } ${equals} ${_stringify(v, depth + 1, next_from(k))}`
            )
            .join(`, ${newline}`)}${newline}${inline ? '' : indent_lessone}}`
      case 'number':
        if (!isFinite(data)) return '"Inf"'
        else if (isNaN(data)) return '"NaN"'
        return value[type] ? value[type](data) : data
      case 'string':
        return `"${data.replace(/"/g, '\\"')}"`
      case 'boolean':
        return data ? 'true' : 'false'
      default:
        return 'null'
    }
  }

  return _stringify(data)
}

export const dispatchEvent = (name: string, detail: CustomEventInit) => {
  const event = new CustomEvent(name, detail)
  window.dispatchEvent(event)
}

export const url = (path: string) => {
  return (args?: { [x: string]: string | number | boolean }) =>
    !args ? path : generatePath(path, args)
  // {
  //   if (args.length > 0) {
  //     let p = 0
  //     return path.replace(/:\w+\??/g, () => args[p++] || "")
  //   }
  //   return path
  // }
}

// https://stackoverflow.com/a/27078401
// NOT WORKING?!?!
export const throttle = <T extends Array<any>, U>(
  callback: (...args: T) => void,
  limit: number
): typeof callback => {
  var waiting = false // Initially, we're not waiting
  return function (...args: T): void {
    // We return a throttled function
    if (!waiting) {
      // If we're not waiting
      callback.apply(this, arguments) // Execute users function
      waiting = true // Prevent future invocations
      setTimeout(function () {
        // After a period of time
        waiting = false // And allow future invocations
      }, limit)
    }
  }
}

// https://stackoverflow.com/a/5306832
export const arrayMove = (arr: any[], old_idx: number, new_idx: number) => {
  while (old_idx < 0) {
    old_idx += arr.length
  }
  while (new_idx < 0) {
    new_idx += arr.length
  }
  if (new_idx >= arr.length) {
    var k = new_idx - arr.length + 1
    while (k--) {
      arr.push(undefined)
    }
  }
  arr.splice(new_idx, 0, arr.splice(old_idx, 1)[0])
  return arr // for testing purposes
}

export { css, cx }
