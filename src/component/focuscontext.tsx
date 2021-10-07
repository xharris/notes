import React, { ReactNode, useContext, useState, createContext } from 'react'

const FocusContext = createContext<{
  focusing: boolean
  requestFocus?: () => void
  stopFocus?: () => void
}>({ focusing: false })

export const FocusContextProvider = ({ children }: { children: ReactNode }) => {
  const [focusing, setFocusing] = useState(false)

  return (
    <FocusContext.Provider
      value={{
        focusing,
        requestFocus: () => {
          setFocusing(true)
        },
        stopFocus: () => {
          setFocusing(false)
        },
      }}
    >
      {children}
    </FocusContext.Provider>
  )
}

export const useFocusContext = () => useContext(FocusContext)
