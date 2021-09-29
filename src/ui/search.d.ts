type Block = {
  name: string
  example: string
  icon: string
  color?: string
  suggest?: (result: string) => string | string[]
  regex?: [RegExp, string][]
}

export declare function Search(props: {
  className?: string
  label?: string
  active: boolean
  placeholder?: string
  blocks: Block[]
  onSearch: (query: string) => void
}): JSX.Element

// type Search = {
//   className?: string
//   active?: boolean
//   placeholder?: string
//   blocks: Block[]
//   onSearch: (blocks:Block[]) => void
// }
