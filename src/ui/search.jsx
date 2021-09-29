import React, { useRef, useEffect, useState, useCallback } from "react"
import { bem, css, cx, isDark } from "style"
import {Input} from "ui/form"
import {Icon, Button} from "ui/react"
import { QuickTheme } from "ui/mui"
import Chip from "@material-ui/core/Chip"
import { makeStyles } from '@material-ui/core/styles';
import * as Color from "@material-ui/core/colors"

const bss = bem("search")

const Block = ({ value, render, icon, clickable, variant, color, onDelete, onClick }) => {
  return (
      <QuickTheme theme={color ? {
        palette: {
          primary: {
            main: Color[color][500],
            contrastText: isDark(color) ? Color.grey[100] : Color.grey[900]
          }
        }
      } : null}>
        <Chip 
        className={bss("block")} 
        color={color ? "primary" : "default"}
        label={render ? render(value) : value} 
        icon={icon && <Icon icon={icon}/>} 
        clickable={clickable}
        variant={variant}
        onDelete={onDelete}
        onPointerUp={onClick}
        size="small"
      />
    </QuickTheme>
  )
}

export const Search = ({ 
  className, 
  label,
  active:_active,
  placeholder = "Search...",
  blocks:input_blocks = [],
  onSearch = (()=>{})
}) => {
  const [active, setActive] = useState(_active)
  const [focused, setFocused] = useState()
  const [blocks, setBlocks] = useState([])
  const [suggestions, setSuggestions] = useState({})
  const [value, setValue] = useState("")
  const el_input = useRef()

  const getKey = (type, item) => `${type}+${item.value}`

  const generateSuggestions = useCallback((v) => {
    let new_suggestions = {}

    const addSuggestion = (type, list) => {
      if (list.length > 0) {
        new_suggestions = {...new_suggestions, [type]:list.map(l => ({ ...l, key:getKey(type, l) }))}
        setSuggestions(new_suggestions)
      }
    }

    setSuggestions({})
    for (const block of input_blocks) {
      // show example block
      if (focused && (!v || v.length <= 0)) {
        let examples = [].concat(block.example)
        if (examples.length > 0) {
          examples.forEach(ex => {
            addSuggestion(block.name, [{ ...block, is_example:true, value:ex }])
          })
        }
      }
      // text block with suggestions
      else if (block.suggest && v && v.length > 0) {
        Promise.resolve(block.suggest(v))
          .then(info => addSuggestion(block.name, [].concat(info).map(t => ({ ...block, value:t, groups:[t] }))))
      }
      // normal input block
      else if (block.regex) {
        let found = false
        for (const re of block.regex) {
          // found a matching regex, break and add the block
          if (!found && re[0].test(v)) {
            if (re.length > 1)
              block.value = v.replace(re[0], re[1])
            block.groups = v.match(re[0]).slice(1)
            addSuggestion(block.name, [block])
            found = true
          }
        }
      } else if (v && v.length > 0) {
        addSuggestion(block.name, [block])
      }
    }
  }, [setSuggestions, focused, input_blocks, suggestions, setSuggestions])
  
  useEffect(() => {
    generateSuggestions(value)
  }, [value, focused])

  const refocus = useCallback(() => {
    if (el_input.current)
      el_input.current.focus()
  }, [el_input])

  return <div className={cx(bss(), className)}>
    <Input
      ref={el_input}
      className={bss("input")}
      placeholder={placeholder}
      label={label}
      value={value}
      onChange={e => setValue(e.target.value)}
      onFocus={e => setFocused(true)}
      onBlur={e => {
        if (el_input.current && !el_input.current.contains(e.currentTarget))
          setFocused(false)
      }}
      onSubmit={blocks.length > 0 ? () => onSearch(blocks.map(({ groups, value, name, key }) => ({ groups, value, name, key }))) : null}
      onKeyDown={e => {
        if (e.key === "Backspace" && value.length === 0 && blocks.length > 0) {
          setBlocks([ ...blocks.slice(0,-1) ])
        }
      }}
    >
      {blocks.map((block) => 
        <Block 
          {...block} 
          color={block.color}
          onClick={e => { e.stopPropagation() }}
          onDelete={() => {
            setBlocks([ ...blocks.filter(b => b.key !== block.key) ])
            refocus()
          }}
        />
      )}
    </Input>
    <div 
      className={bss("suggestions")}
    >
      {Object.keys(suggestions).length > 0 && <div className={bss("helper")}>{
        value && value.length > 0 ? "Click to add..." : "Examples:"
      }</div>}
      {Object.entries(suggestions).reduce((result, [type, slist]) => 
        result.concat(slist.map(block => 
          <Block 
            {...block} 
            tabIndex={0}
            color={block.color}
            value={block.value || value} 
            clickable={!block.is_example}
            variant={block.is_example ? "outlined" : "default"}
            onClick={!block.is_example ? (e => {
              e.stopPropagation()
              e.preventDefault()
              if (!blocks.some(b => b.key === block.key))
                setBlocks([ ...blocks, block ])
              // return focus to the text input and clear it
              setValue("")
              refocus()
            }) : null}
          />
        ))
      , [])}
    </div>
  </div>
}