const audio = require('./audio.js');
const main = require('./overall.js');

const notifier = require('node-notifier');
const path = require('path');

const remote = require('electron').remote;

var last_notified = Date.now();
$(audio.element).on("startPlaying", function(event, metadata) {
	if( !main.settings.enable.notifications
		|| remote.getCurrentWindow().isFocused()
		|| Date.now() < (main.settings.notify_wait*1000) + last_notified) {
		return;
	}

	last_notified = Date.now();

	notifier.notify({
		title: metadata.title,
		message: [metadata.artist, metadata.album].join("\r\n"),
		icon: path.join(main.tmpArt)
	});
});