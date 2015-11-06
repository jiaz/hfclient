import app from 'app';
import BrowserWindow from 'browser-window';

import crashReporter from 'crash-reporter';

crashReporter.start();

let mainWindow = null;

app.on('window-all-closed', () => {
    app.quit();
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({width: 1600, height: 600});
    mainWindow.loadUrl('file://' + __dirname + '/index.html');
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});
