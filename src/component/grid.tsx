import React, { ReactNode, useEffect, useRef } from 'react'
import StackGrid from 'react-stack-grid'
import { cx, css, bem } from 'ui'

const style = bem('grid')

type Grid = {
  className?: string
  children?: ReactNode
  width?: number
}

export const Grid = ({ className, children, width = 300 }: Grid) => {
  const ref_grid = useRef<any>()

  useEffect(() => {
    let interval: NodeJS.Timer
    if (!interval)
      interval = setInterval(() => {
        if (ref_grid.current) ref_grid.current.updateLayout()
      }, 1000)
    return () => {
      if (interval) {
        clearInterval()
        interval = null
      }
    }
  }, [])

  return (
    <div className={cx(style(), className)}>
      <StackGrid
        style={{ width: '100%', height: '100%' }}
        className={css`
          &:hover {
            z-index: 100 !important;
          }
        `}
        columnWidth={width}
        gridRef={(grid) => (ref_grid.current = grid)}
      >
        {children}
      </StackGrid>
    </div>
  )
}

export default Grid
