// Add ipcMain and Menu to imports here.

// Remote module was removed for security reasons, and 
// desktopCapturer is now restricted to the Main process 
// (background logic) rather than the Renderer process 
// (frontend buttons)

// Use IPC (Inter-Process Communication) to have 
// render.js sends a message to index.js and index.js to send back the list of screens.

const { app, BrowserWindow, ipcMain, Menu, desktopCapturer } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        nodeIntegration: true,  // Allows access to node.js global in frontend code
                                // An empty browser window to load the html below to it.
        contextIsolation: false,    // Allows `require` to work in render.js \ How?
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Add the desktopCapturer here, to Main instead of Renderer.

ipcMain.on('show-video-sources', async (event) => {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => event.sender.send('source-selected', source.id)
      };
    })
  );

  videoOptionsMenu.popup();
});

const { writeFile } = require('node:fs');
const { dialog } = require('electron');

ipcMain.on('save-video', async (event, buffer) => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('Video saved successfully!'));
  }
});