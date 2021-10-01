import electron from 'electron'

// Electron

interface chooseFileOptions extends Electron.OpenDialogOptions {
  multiple?: boolean
  folder?: boolean
}

export class Electron {
  // static menu(
  //   template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[]
  // ) {
  //   const menu = Menu.buildFromTemplate(template)
  //   menu.popup()
  // }

  // static chooseFile(options: chooseFileOptions = {}) {
  //   return dialog.showOpenDialog({
  //     properties: [
  //       options.folder ? 'openDirectory' : 'openFile',
  //       options.multiple ? 'multiSelections' : null,
  //     ],
  //     ...options,
  //   })
  // }

  // static openDevTools() {
  //   getCurrentWindow().webContents.openDevTools()
  // }

  // static on(...args: Parameters<Electron.BrowserWindow['on']>) {
  //   getCurrentWindow().on(...args)
  // }

  static send(channel: string, ...args: any[]) {
    return electron.ipcRenderer.send(channel, ...args)
  }
}

// export const { isDev } = remoteRequire('./util.js')
