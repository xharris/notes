import React, {
  ComponentProps,
  createContext,
  DependencyList,
  FormHTMLAttributes,
  FunctionComponent,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { basename } from 'path'
import * as FIcon from 'react-feather'
import tinycolor from 'tinycolor2'
import { bem, cx, ObjectAny, capitalize, css, throttle } from '.'
import {
  Dialog as MatDialog,
  Menu as MatMenu,
  MenuItem as MatMenuItem,
} from '@material-ui/core'
import * as FeatherIcon from 'react-icons/fi'
import * as MaterialIcon from 'react-icons/md'

// HTML

export type FC<P> = FunctionComponent<P>
export type HTMLDiv = HTMLAttributes<HTMLDivElement>
export type ReactChildren = (args: { tab: string }) => ReactNode | ReactNode

interface IIcon extends HTMLAttributes<HTMLImageElement> {
  name: string
  color?: string
  library?: string
}
type IconElement = { [key: string]: FIcon.Icon }
const bss_icon = bem('uiicon')

const libraries: ObjectAny = {
  feather: [FeatherIcon, 'fi'],
  material: [MaterialIcon, 'md'],
}

export const Icon: FC<IIcon> = ({
  className,
  name,
  color,
  library = 'feather',
  ...props
}) => {
  const lib = libraries[library] || [null, '']
  const componentName = `${lib[1]}-${name}`
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join('')

  const IconElement = (lib[0] as IconElement)[componentName]

  return (
    <IconElement
      className={cx(
        bss_icon(),
        css({
          stroke: color,
          fill: color,
        }),
        className
      )}
      {...(props as FIcon.Icon)}
    />
  )
}

interface IButton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  icon?: string
  color?: string
  round?: boolean | number
  transparent?: boolean
  library?: string
}
const bss_button = bem('uibutton')
export const Button: FC<IButton> = ({
  className,
  text,
  icon,
  color,
  type = 'button',
  transparent,
  round,
  library,
  ...props
}) => (
  <button
    className={cx(
      bss_button(),
      round &&
        css({
          borderRadius: '100%',
          width: typeof round === 'number' ? round : 30,
          height: typeof round === 'number' ? round : 30,
        }),
      transparent &&
        css({
          '&:not(:hover)': {
            boxShadow: 'none',
            background: 'none',
          },
        }),
      css(`
      // &:hover:enabled {
      //   &, > * {
      //     color: ${tinycolor(color).isDark() ? '#FAFAFA' : '#212121'}
      //   }
      //   background-color: ${color}
      // }
    `),
      className
    )}
    type={type}
    {...props}
  >
    {icon ? <Icon name={icon} color={color} library={library} /> : null}
    {text ? <p>{text}</p> : null}
  </button>
)

interface IInput extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | boolean
  inputClassName?: string
  // chooseFileOptions?:chooseFileOptions,
  onFile?: (v: Electron.OpenDialogReturnValue) => any
  onError?: (...args: any[]) => void
  icon?: string
  values?: [string, string][] | string[] | string[][]
}
const bss_input = bem('uiinput')
export const Input: FC<IInput> = ({
  className,
  inputClassName,
  label,
  width,
  title,
  type,
  // chooseFileOptions,
  onFile = () => {},
  onError,
  icon,
  values,
  defaultValue,
  ...props
}) => {
  const [value, setValue] = useState<string[]>(
    [].concat(defaultValue).filter((p) => p)
  )

  return type === 'button' ? (
    <Button icon={icon} {...props} />
  ) : (
    <label
      className={cx(bss_input({ labeled: !!label }), className)}
      title={title}
    >
      {label}
      {type === 'file' ? (
        'input type file not supported'
      ) : // <Button
      //   className={cx(bss_input("file-input"), inputClassName)}
      //   text={value.length > 0 ? value.map(p => basename(p)).join(', ') : "Choose file..."}
      //   icon={icon || "file"}
      //   onClick={() => null
      //     Electron.chooseFile(chooseFileOptions)
      //       .then(result => {
      //         setValue(result.filePaths)
      //         return onFile(result)
      //       })
      //       .catch(onError)
      //   }
      // />
      type === 'select' ? (
        <select
          className={cx(bss_input('select-input'), inputClassName)}
          {...(props as unknown as React.SelectHTMLAttributes<HTMLSelectElement>)}
          value={defaultValue || '_DEFAULT_'}
          title={(title || defaultValue || '').toString()}
        >
          <option key="_default" value="_DEFAULT_" disabled hidden>
            {props.placeholder || '...'}
          </option>
          {values.map((v) => {
            const value = Array.isArray(v) ? v[0] : v
            const label = Array.isArray(v) ? v[1] : v
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          className={cx(bss_input('input'), inputClassName)}
          defaultValue={defaultValue}
          rows={10}
          {...(props as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={cx(bss_input('input'), inputClassName)}
          type={type}
          defaultValue={defaultValue}
          {...props}
        />
      )}
      {icon && <Icon name={icon} />}
    </label>
  )
}

type FormCustomRender = () => {}

export type FormOptions = ObjectAny<FormOption>

interface FormOption extends IInput {
  columns?: number
  names?: string[]
  options?: { [key: string]: FormOption }
}

type IForm = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'defaultValue' | 'onChange'
> & {
  defaultValue: ObjectAny
  order?: (string | FormCustomRender)[]
  options?: FormOptions
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string,
    subname?: string
  ) => void
  onFile?: (
    v: Electron.OpenDialogReturnValue,
    name: string,
    subname?: string
  ) => any
}

const bss_form = bem('uiform')
export const Form: FC<IForm> = ({
  className,
  defaultValue,
  order,
  options = {},
  onChange,
  onFile,
}) => (
  <form
    className={cx(bss_form(), className)}
    onSubmit={(e) => e.preventDefault()}
  >
    {(order || Object.keys(defaultValue)).map((name) => {
      // custom render
      if (typeof name === 'function')
        return (
          <div className={bss_form('custom')} key={`custom-${name}`}>
            {name()}
          </div>
        )

      const opts = options[name] || {}
      // multiple inputs
      if (Array.isArray(defaultValue[name]) || opts.columns || opts.names) {
        const columns = opts.columns || opts.names.length
        const subnames: string[][] = (
          opts.names || new Array(defaultValue[name].length)
        ).reduce((res, _, i, arr) => {
          if (i % columns === 0) {
            const chunk = arr.slice(i, i + columns)
            res.push(chunk)
          }
          return res
        }, [])

        return (
          <div className={bss_form('group')} key={`group-${name}`}>
            {opts.label !== false && (
              <div className={bss_form('group-label')}>
                {opts.label || capitalize(name)}
              </div>
            )}
            <div className={bss_form('subgroups')}>
              {subnames.map((group, g) => (
                <div key={`group-${g}`} className={bss_form('subgroup')}>
                  {group.map((subname) => {
                    const suboptions = opts.options
                      ? { ...opts, label: null, ...opts.options[subname] }
                      : opts

                    return (
                      <Input
                        className={bss_form('input')}
                        key={subname}
                        name={name}
                        defaultValue={defaultValue[name][subname]}
                        onChange={(e) => onChange(e, name, subname)}
                        onFile={(e) => onFile(e, name, subname)}
                        placeholder={subname}
                        title={subname}
                        {...suboptions}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      }

      // single input
      return (
        <Input
          key={name}
          label={capitalize(name)}
          name={name}
          defaultValue={defaultValue[name]}
          onChange={(e) => onChange(e, name)}
          onFile={(e) => onFile(e, name)}
          title={opts.title}
          {...options[name]}
        />
      )
    })}
  </form>
)

type Dialog = ComponentProps<typeof MatDialog>

const bss_dialog = bem('dialog')

export const Dialog = ({ className, ...props }: Dialog) => (
  <MatDialog className={cx(bss_dialog(), className)} {...props} />
)

type Menu = ComponentProps<typeof MatMenu>
type MenuItem = ComponentProps<typeof MatMenuItem>
const style_menu = bem('menu')
export const Menu = ({ className, ...props }: Menu) => (
  <MatMenu {...props} className={cx(style_menu(), className)} />
)
export const MenuItem = ({ className, ...props }: MenuItem) => (
  <MatMenuItem {...props} className={cx(style_menu('item'), className)} />
)

// CSS / Styling

interface IThemeProps {
  color: {
    fg: string
    bg: string
    type: ObjectAny<string>
  }
}

const theme_default = {
  color: {
    fg: '#FDD835',
    bg: '#FAFAFA',
    type: {},
  },
}
const ThemeContext = createContext({
  ...theme_default,
})
export const ThemeProvider = (props: React.ProviderProps<IThemeProps>) => (
  <ThemeContext.Provider value={{ ...theme_default }} {...props} />
)
export const useTheme = (): IThemeProps => useContext(ThemeContext)

// Util

export const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight])

  useEffect(() => {
    let evt = () => {
      setSize([window.innerWidth, window.innerHeight])
    }
    window.addEventListener('resize', evt)
    return () => {
      window.removeEventListener('resize', evt)
    }
  }, [])

  return size
}

export const useEvent = (
  type: string | string[],
  listener: any,
  deps?: DependencyList,
  object: EventTarget = window
) => {
  const callback = useCallback(
    (...args: any[]) => {
      requestAnimationFrame(listener.bind(undefined, ...args))
    },
    [listener, ...deps]
  )
  const types = [].concat(type)

  useEffect(() => {
    types.forEach((type) => object.addEventListener(type, callback))
    return () => {
      types.forEach((type) => object.removeEventListener(type, callback))
    }
  }, [callback, object, types])
}

export const useLayoutEvent = (
  type: string | string[],
  listener: any,
  deps?: DependencyList,
  object: EventTarget = window
) => {
  const callback = useCallback(
    (...args: any[]) => {
      requestAnimationFrame(listener.bind(undefined, ...args))
    },
    [listener, ...deps]
  )
  const types = [].concat(type)

  useLayoutEffect(() => {
    types.forEach((type) => object.addEventListener(type, callback))
    return () => {
      types.forEach((type) => object.removeEventListener(type, callback))
    }
  }, [callback, object, types])
}

// also doesnt work :\
export const useThrottle = (fn: (...args: any[]) => void, ms: number) =>
  useCallback(throttle(fn, ms), [fn])

// Debugging

export const useTraceUpdate = (props: ObjectAny) => {
  const prev = useRef(props)
  useEffect(() => {
    const changedProps = Object.entries(props).reduce<ObjectAny>(
      (ps, [k, v]) => {
        if (prev.current[k] !== v) {
          ps[k] = [prev.current[k], v]
        }
        return ps
      },
      {}
    )
    if (Object.keys(changedProps).length > 0) {
      console.log('Changed props:', changedProps)
    }
    prev.current = props
  })
}
