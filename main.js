const {app, BrowserWindow} = require('electron');
const electron = require('electron');
const fs = require('fs');

const Menu = electron.Menu;
const ipcMain = electron.ipcMain;

var win;

function createWindow() {
	win = new BrowserWindow({
		width: 1024,
		height: 600,
		icon: './icon.png'
	});

	win.loadURL(`file://${__dirname}/index.html`);
	win.webContents.openDevTools();

	win.on("closed", function() {
		win = null;
	});
}

const mainMenu_template = [
	{
		label: 'File',
		submenu: [
			{
				label: 'Developer Tools',
				accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.toggleDevTools()
				}
			},

			{
				type: 'separator'
			},

			{
				role: 'quit'
			}
		]
	},

	{
		label: 'Window',
		submenu: [
			{
				label: 'Reload',
				accelerator: 'CmdOrCtrl+R',
				click: function(item, focusedWindow) {
					if(focusedWindow) {
						focusedWindow.reload();
					}
				}
			}
		]
	},

	{
		label: 'Playback',
		submenu: [
			{
				label: 'Play/Pause',
				accelerator: 'CmdOrCtrl+Shift+P',
				click: function() {
					win.webContents.send('playback', 'togglePlayPause');
				}
			},

			{
				label: 'Restart',
				accelerator: 'CmdOrCtrl+Shift+R',
				click: function() {
					win.webContents.send('playback', 'restart');
				}
			},

			{
				type: 'separator'
			},

			{
				label: 'Next',
				accelerator: 'CmdOrCtrl+Shift+Down',
				click: function() {
					win.webContents.send('playback', 'next');
				}
			},

			{
				label: 'Previous',
				accelerator: 'CmdOrCtrl+Shift+Up',
				click: function() {
					win.webContents.send('playback', 'previous');
				}
			}
		]
	}
];

const mainMenu = Menu.buildFromTemplate(mainMenu_template);
Menu.setApplicationMenu(mainMenu);

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