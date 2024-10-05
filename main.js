const { app, BrowserWindow } = require('electron')
const path = require('node:path')

let win;
const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(app.getAppPath(), 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true
        }
    })

    win.loadFile('index.html')
    win.webContents.openDevTools({ mode: 'detach' })
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
