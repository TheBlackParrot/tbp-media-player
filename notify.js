const audio = require('./audio.js');
const main = require('./overall.js');

const notifier = require('node-notifier');
const path = require('path');

const remote = require('electron').remote;

$(audio.element).on("startPlaying", function(event, metadata) {
	if(!main.settings.enable.notifications || remote.getCurrentWindow().isFocused()) {
		return;
	}

	notifier.notify({
		title: metadata.title,
		message: [metadata.artist, metadata.album].join("\r\n"),
		icon: path.join(main.tmpArt)
	});
});