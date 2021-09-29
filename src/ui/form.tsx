import React, { createContext, useCallback, useState } from 'react'
import { bem, capitalize, color, colors, css, cx, ObjectAny } from 'ui'
import { FC, Icon } from './react'
import { GithubPicker } from 'react-color'

const style = bem('uiform')

interface IForm
  extends Omit<
    React.FormHTMLAttributes<HTMLFormElement>,
    'defaultValue' | 'onChange'
  > {
  defaultValue: ObjectAny
  onChange: (
    e: React.FormEvent<any> | { currentTarget: { value: any } },
    name: string
  ) => void
  className?: string
}

type FormContext<T> = {}
const FormContext = createContext<{
  [key: string]: any
  onChange: IForm['onChange']
}>({ onChange: () => {} })

export const Form: FC<IForm> = ({
  defaultValue,
  onChange: _onChange,
  className,
  ...props
}) => (
  <FormContext.Provider
    value={{
      ...defaultValue,
      onChange: (e, name) => {
        if (_onChange) _onChange(e, name)
      },
    }}
  >
    <form
      {...props}
      onSubmit={(e) => {
        if (props.onSubmit) return props.onSubmit(e)
        else return e.preventDefault()
      }}
      className={cx(style(), className)}
    />
  </FormContext.Provider>
)

interface IInput extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
  label?: string
  colors?: 'bg' | 'fg'
}

export const Input: FC<IInput> = ({
  className,
  label,
  children,
  type = 'text',
  colors: _colors,
  ...props
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false)
  return (
    <FormContext.Consumer>
      {({ onChange, ...values }) => (
        <label className={cx(style('wrapper', { type }), className)}>
          {label && (
            <p className={style('label')}>{label || capitalize(props.name)}</p>
          )}
          {type !== 'color' && (
            <input
              className={style('input')}
              defaultValue={values[props.name]}
              onChange={(e) => onChange(e, props.name)}
              type={type}
              {...props}
            />
          )}
          {type === 'checkbox' && (
            <>
              <Icon
                name={'check-circle'}
                className={style('checkbox-icon', { checked: 'true' })}
              />
              <Icon
                name={'circle'}
                className={style('checkbox-icon', { checked: 'false' })}
              />
            </>
          )}
          {type === 'color' && (
            <>
              <div
                className={cx(
                  style('colortrigger'),
                  css({
                    backgroundColor: values[props.name],
                  })
                )}
                onClick={() => setShowColorPicker(true)}
              />
              {showColorPicker && (
                <div className={style('colorpicker')}>
                  <div
                    className={style('clickout')}
                    onClick={() => setShowColorPicker(false)}
                  />
                  <GithubPicker
                    color={color(values[props.name], _colors)}
                    colors={Object.values(colors).map((c) => c[_colors])}
                    onChange={(e) => {
                      onChange(
                        {
                          currentTarget: {
                            value: Object.entries(colors).find(
                              ([_, v]) =>
                                v[_colors].toLowerCase() === e.hex.toLowerCase()
                            )[0],
                          },
                        },
                        props.name
                      )
                    }}
                  />
                </div>
              )}
            </>
          )}
          {children}
        </label>
      )}
    </FormContext.Consumer>
  )
}

interface ITextArea extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
  label?: string
}

export const TextArea: FC<ITextArea> = ({ className, label, ...props }) => (
  <FormContext.Consumer>
    {({ onChange, ...values }) => (
      <label className={cx(style('wrapper', { type: 'textarea' }), className)}>
        {label && (
          <p className={style('label')}>{label || capitalize(props.name)}</p>
        )}
        <textarea
          className={style('input')}
          defaultValue={values[props.name]}
          onChange={(e) => onChange(e, props.name)}
          {...props}
        />
      </label>
    )}
  </FormContext.Consumer>
)

interface ISelect extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string
  label?: string
  values: number[] | string[]
  labels?: typeof this['values']
}

export const Select: FC<ISelect> = ({ className, label, labels, ...props }) => (
  <FormContext.Consumer>
    {({ onChange, ...values }) => (
      <label className={cx(style('wrapper', { type: 'select' }), className)}>
        {label && (
          <p className={style('label')}>{label || capitalize(props.name)}</p>
        )}
        <select
          className={style('input')}
          defaultValue={values[props.name]}
          onChange={(e) => onChange(e, props.name)}
          {...props}
        >
          {props.values.map((v, i) => (
            <option value={v}>{labels ? labels[i] : v}</option>
          ))}
        </select>
      </label>
    )}
  </FormContext.Consumer>
)
