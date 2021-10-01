const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// hot reload
const env = process.env.NODE_ENV || 'development'
if (env === 'development') {
  try {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true,
    })
  } catch (_) {
    console.log('Error')
  }
}

const load = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      devTools: env === 'development',
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  })
  win.loadURL(
    env === 'development'
      ? 'http://localhost:8080'
      : `file://${path.join(__dirname, './public/index.html')}`
  )

  const devtools = new BrowserWindow()
  win.webContents.setDevToolsWebContents(devtools.webContents)
  win.webContents.openDevTools({ mode: 'detach' })
  // win.loadFile('public/index.html')
}

app.whenReady().then(() => {
  load()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) load()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('minimize', (e) => {
  BrowserWindow.getFocusedWindow().minimize()
})

ipcMain.on('toggle-maximize', (e) => {
  const win = BrowserWindow.getFocusedWindow()
  win.isMaximized() ? win.unmaximize() : win.maximize()
})

ipcMain.on('close', (e) => {
  BrowserWindow.getFocusedWindow().close()
})
