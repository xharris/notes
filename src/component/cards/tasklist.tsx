import React, { useEffect, useRef, useState } from 'react'
import { bem, css } from 'ui'
import './tasklist.scss'
import { Icon } from 'ui/react'

type Tasklist = {
  values?: { text: string; checked: boolean }[]
} & Section

const style = bem('tasklist')

const Tasklist = ({ _id, values, update }: Tasklist) => {
  const [focusNext, setFocusNext] = useState(values.length + 1)
  const el_new = useRef<HTMLInputElement>()

  const setValues = (values: Tasklist['values']) =>
    update<Tasklist>({
      _id,
      values: values.filter((v) => v.text.trimEnd().length > 0),
    })
  const setValueChecked = (i: number, v: boolean) => {
    values[i].checked = v
    update<Tasklist>({ _id, values })
  }

  useEffect(() => {
    if (focusNext === values.length && el_new.current) {
      setFocusNext(values.length + 1)
      el_new.current.focus()
    }
  }, [values, el_new, focusNext])

  return (
    <div className={style()}>
      <ul>
        {values.map((v, i) => (
          <li key={i} className={style('item', { checked: v.checked })}>
            <label>
              <input
                type="checkbox"
                defaultChecked={v.checked}
                onChange={(e) => setValueChecked(i, e.currentTarget.checked)}
              />
              <Icon
                className={style('icon')}
                name={v.checked ? 'check-square' : 'square'}
              />
            </label>
            <input
              className={style('text')}
              type="text"
              defaultValue={v.text}
              onChange={(e) => {
                values[i].text = e.currentTarget.value
                setValues(values)
              }}
            />
          </li>
        ))}
        <li key={values.length} className={style('item', { new: true })}>
          <Icon className={style('icon')} name="square" />
          <input
            ref={el_new}
            className={style('text', { new: true })}
            type="text"
            onBlur={(e) =>
              // TODO: try if blur is outside of this section's div, setNextFocus(null)
              setValues([
                ...values,
                { text: e.currentTarget.value, checked: false },
              ])
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setValues([
                  ...values,
                  { text: e.currentTarget.value, checked: false },
                ])
              }
            }}
          />
        </li>
      </ul>
    </div>
  )
}

type TasklistPreview = {
  values?: { text: string; checked: boolean }[]
} & Section

const TasklistPreview = ({ _id, values, update }: TasklistPreview) => {
  const setValueChecked = (i: number, v: boolean) => {
    values[i].checked = v
    update<Tasklist>({ _id, values })
  }
  return (
    <div className={style()}>
      <ul>
        {values.map((v, i) => (
          <li key={i} className={style('item', { checked: v.checked })}>
            <label>
              <input
                type="checkbox"
                defaultChecked={v.checked}
                onChange={(e) => setValueChecked(i, e.currentTarget.checked)}
              />
              <Icon
                className={style('icon')}
                name={v.checked ? 'check-square' : 'square'}
              />
            </label>
            <p className={style('text')}>{v.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default {
  component: Tasklist,
  preview: TasklistPreview,
  name: 'Tasklist',
  icon: 'check-square',
  template: {
    values: [],
  },
}
