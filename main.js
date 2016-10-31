const {app, BrowserWindow} = require('electron');
const electron = require('electron');
const fs = require('fs');

const Menu = electron.Menu;
const ipcMain = electron.ipcMain;

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

ipcMain.on('listRowContextMenu', function(event, file) {
	console.log("received listRowContextMenu request");
	var template = [
		{
			label: 'Play Next',
			click: function() {
				event.sender.send('listRowContextMenuReply', 'PlayNext', file);
			}
		},

		{
			label: 'Play Last',
			click: function() {
				event.sender.send('listRowContextMenuReply', 'PlayLast', file);
			}			
		},

		{
			type: 'separator'
		},

		{
			label: 'Refresh Cached Data',
			click: function() {
				event.sender.send('listRowContextMenuReply', 'RefreshData');
			}
		}
	];

	var context = Menu.buildFromTemplate(template);
	context.popup(BrowserWindow);
});