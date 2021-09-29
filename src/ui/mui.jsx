import React from 'react'
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@material-ui/core/styles"

export const QuickTheme = ({ theme:_theme, children }) => {
  const [theme, setTheme] = useState(createTheme())
  useEffect(() => {
    if (_theme)
      setTheme(createTheme(_theme))
  }, [_theme])

  return theme ? 
  (<MuiThemeProvider theme={theme}>
    {children}
  </MuiThemeProvider>)
  :
  (<>
    {children}
  </>)
}
