const {app, BrowserWindow} = require('electron');
const fs = require('fs');

var win;

function createWindow() {
	win = new BrowserWindow({
		width: 1024,
		height: 600
	});

	win.loadURL(`file://${__dirname}/index.html`);
	win.webContents.openDevTools();

	win.on("closed", function() {
		win = null;
	});
}

app.on("ready", createWindow);

app.on("window-all-closed", function() {
	app.quit();
});