import React, { useState } from 'react'
import { cx, bem, css, color, StringLike } from 'ui'
import 'style/tag.scss'
import { Button, Icon } from 'ui/react'
import { Form, Input } from 'ui/form'

const style = bem('tag')

interface ITag extends React.HTMLProps<HTMLSpanElement> {
  _id?: string
  icon?: string
  color?: string
  backgroundColor?: string
  value?: StringLike
  draggable?: any
  onDelete?: () => void
}

export const Tag = ({
  icon,
  color: _color = 'blue_grey',
  backgroundColor,
  value,
  draggable,
  onDelete,
  ...props
}: ITag) => {
  return (
    <span
      {...props}
      className={cx(
        style(),
        css({
          color: color(_color, 'fg'),
          backgroundColor: color(_color, 'bg'),
        })
      )}
      draggable={!!draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copyMove'
        e.dataTransfer.setData('text/plain', JSON.stringify(draggable))
      }}
    >
      {value && <p>{value}</p>}
      {icon && <Icon name={icon} />}
      {onDelete && (
        <Button
          icon="x"
          onClick={onDelete}
          title="Remove tag"
          className={cx(
            style('delete-btn'),
            css({
              '.uiicon': {
                color: color(_color, 'fg'),
              },
            })
          )}
        />
      )}
    </span>
  )
}

type TagFavorite = {
  value?: number
}
