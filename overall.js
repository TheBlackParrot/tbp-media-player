const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;

const fs = require('fs');

var settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
exports.settings = settings;

const audioMetadata = require('musicmetadata');
const audio = require('./audio.js');
exports.audio = audio;

const bottom = require('./bottom.js');
exports.bottom = bottom;

const dir = require('node-dir');

var util = require('./util.js');
exports.util = util;

const color = require('./color.js');
exports.color = color;

const notify = require('./notify.js');

var tmp = require('tmp');
exports.tmp = tmp;
var tmpArt;
exports.tmpArt = tmpArt;

const localStorage = window.localStorage;

var music_dir = settings.music_dir;
//var music_dir = "/home/theblackparrot/as2";
var all_files = {};
exports.all_files = all_files;

function loadAllFiles(callback) {
	dir.files(music_dir, function(err, files) {
		if(err) throw err;

		for(var i in files) {
			var file = files[i];

			if(/.mp3$|.m4a$|.ogg$|.flac$|.wma$/i.test(file)) {
				all_files[files[i]] = null;
			}
		}

		if(typeof callback === "function") {
			callback(files);
		}
	});
}
exports.loadAllFiles = loadAllFiles;

function fetchMetadata(file, callback) {
	var cached = localStorage.getItem(file);
	if(cached) {
		var metadata = all_files[file] = JSON.parse(cached);

		if(typeof callback === "function") {
			callback(metadata);
		} else {
			return metadata;
		}
	} else {
		var stream = fs.createReadStream(file);

		var parser = audioMetadata(stream, { duration: true }, function(err, metadata) {
			if(err) {
				throw "Error with parsing " + file + ": " + err;
				return;
			}

			delete metadata.picture;
			all_files[file] = metadata;
			localStorage.setItem(file, JSON.stringify(metadata));

			//$(".main_list").append(createListElement(metadata, file));
			stream.close();

			if(typeof callback === "function") {
				callback(metadata);
			} else {
				return metadata;
			}
		});
	}
}

function showView(view, callback) {
	var file_list;
	switch(view) {
		case "library":
			file_list = Object.keys(all_files);
			break;

		case "queue": 
			file_list = queue;
			break;
	}

	var current_file = $("#current-file").attr("data-file");

	for(var id in file_list) {
		var file = file_list[id];
		fetchMetadata(file, function(metadata) {
			var row = createListElement(metadata, file);
			$(".main_list").append(row);

			if(current_file == file) {
				audio.updateNowPlayingInList(file);
			}
		});
	}

	if(typeof callback === "function") {
		callback();
	}
}
exports.showView = showView;

/*
		<table class="main_list">
			<tr>
				<td>Title</td>
				<td>Artist</td>
				<td>Album</td>
				<td>Length</td>
			</tr>
		</table>
*/

function createListElement(metadata, file) {
	var row = $('<tr class="list_row standard-text standard-bg"></tr>');
	row.attr("file", file);

	try {
		var title_element = $('<td></td>');
		title_element.text(metadata.title);
		title_element.attr("title", metadata.title);
	} catch(err) {
		console.warn("Could not obtain title for " + file + ": " + err);
		title_element.text(file);
		title_element.attr("title", file);
		console.log(metadata);
	}

	try {
		var artist_element = $('<td></td>');
		artist_element.text(metadata.artist.join(", "));
		artist_element.attr("title", metadata.artist.join(", "));
	} catch(err) {
		console.warn("Could not obtain artist(s) for " + file + ": " + err);
		artist_element.text("Unknown Artist");
		artist_element.attr("title", "Unknown Artist");
	}

	try {
		var album_element = $('<td></td>');
		album_element.text(metadata.album);
		album_element.attr("title", metadata.album);
	} catch(err) {
		console.warn("Could not obtain album for " + file + ": " + err);
	}

	var duration_element = $('<td></td>');
	duration_element.text(util.getTimeStr(metadata.duration));

	row.append(title_element);
	row.append(artist_element);
	row.append(album_element);
	row.append(duration_element);

	return row;
}

var queue = [];
var current_queue = 0;
exports.queue = queue;
exports.current_queue = current_queue;
function resetQueue() {
	console.log("resetting queue");
	queue = [];
	current_queue = 0;
}
exports.resetQueue = resetQueue;
function populateQueue() {
	if(!queue.length) {
		console.log("populating queue");
		var files = Object.keys(all_files);
		for(var i in files) {
			var file = files[i];
			console.log("adding " + file + " to the queue");

			queue.splice(util.getRandom(0, queue.length), 0, file);
		}
	}
}
exports.populateQueue = populateQueue;
function playNextInQueue() {
	if(!queue.length) {
		return;
	}

	current_queue++;
	if(current_queue >= queue.length) {
		current_queue = 0;
	}
	audio.playAudio(queue[current_queue]);
}
exports.playNextInQueue = playNextInQueue;

function setActiveRow(element) {
	var old = $(".row_selected");

	old.removeClass("row_selected inverse-text color-bg");
	old.find('.list_play').removeClass("inverse-text");
	old.find('.list_play').addClass("color-text");

	element.addClass("row_selected inverse-text color-bg");
	element.find('.list_play').removeClass("color-text");
	element.find('.list_play').addClass("inverse-text");
}

$(".main_list").off("click").on("click", ".list_row", function(event) {
	var file = $(this).attr("file");
	console.log("clicked " + file);

	if($(this).hasClass("row_selected")) {
		switch(current_view) {
			case "queue":
				console.log("queue position before: " + current_queue);
				current_queue = $(this).closest('tr')[0].rowIndex-1;
				console.log("queue position after: " + current_queue);

				audio.playAudio(file);
				break;

			default:
				resetQueue();
				populateQueue();
				queue.splice(0, 0, file);

				audio.playAudio(file);
				break;
		}
	} else {
		setActiveRow($(this));
	}
});

function togglePlaybackState() {
	var symbol = $("#play-button i");

	if(symbol.hasClass("fa-play")) {
		if(!audio.element.readyState) {
			if(queue.length) {
				audio.playAudio(queue[0]);
			} else {
				return;
			}
		} else {
			audio.element.play();
		}

		$(".details").css("opacity", "1");
		symbol.removeClass("fa-play").addClass("fa-pause");

		mpris.playbackStatus = 'Playing';
	} else {
		audio.element.pause();

		$(".details").css("opacity", "0.5");
		symbol.removeClass("fa-pause").addClass("fa-play");

		mpris.playbackStatus = 'Paused';
	}	
}

$("#play-button").on("click", function(event) {
	console.log("clicked play button");
	event.stopPropagation();

	togglePlaybackState();
});

$("#next-button").on("click", function(event) {
	console.log("clicked next button");
	event.stopPropagation();

	playNextInQueue();
});

function okToRestartPlayback() {
	if(audio.element.currentTime < 5) {
		return false;
	}

	return true;
}

function goBackInQueue() {
	if(!queue.length) {
		return;
	}

	current_queue--;
	if(current_queue < 0) {
		current_queue = queue.length-1;
	}
	audio.playAudio(queue[current_queue]);		
}

$("#prev-button").on("click", function(event) {
	event.stopPropagation();

	if(okToRestartPlayback()) {
		audio.element.currentTime = 0;
	} else {
		goBackInQueue();	
	}
});

function resetVolume() {
	var vol = localStorage.getItem("volume");

	if(vol != null) {
		audio.setVolume(parseFloat(vol));
		$("#volume").val(vol*100);
	}
}
exports.resetVolume = resetVolume;

ipcRenderer.on("listRowContextMenuReply", function(event, reply, file) {
	switch(reply) {
		case "PlayNext":
			console.log("play next clicked");
			queue.splice(current_queue+1, 0, file);
			break;

		case "PlayLast":
			console.log("play last clicked");
			queue.splice(queue.length, 0, file);
			break;

		case "RefreshData":
			console.log("refresh clicked");
			break;
	}
});

ipcRenderer.on("playback", function(event, command) {
	switch(command) {
		case "togglePlayPause":
			togglePlaybackState();
			break;

		case "next":
			playNextInQueue();
			break;

		case "previous":
			goBackInQueue();
			break;

		case "restart":
			audio.element.currentTime = 0;
			break;
	}
});

function clearListView() {
	//var template = '<table class="main_list sortable"><tr id="table-header"><th>Title</th><th>Artist</th><th>Album</th><th>Length</th></tr></table>';
	//$(".main_list").html(template);

	$(".main")[0].scrollTop = 0;
	$(".main_list .list_row").remove(); 
}

var current_view = "library";
ipcRenderer.on("view", function(event, command) {
	clearListView();

	if(command == "reload") {
		command = current_view;
	} else {
		current_view = command;
	}

	switch(command) {
		case "library":
			showView("library", function() {
				$(".main_list th").removeClass("sorttable_nosort");
			});
			/*
			showView("library", function() {
				sorttable.makeSortable($(".main_list"));
				$(".main_list").colResizable({
					liveDrag: true,
					minWidth: 70
				});
			});
			*/
			break;

		case "queue":
			showView("queue", function() {
				$(".main_list th").addClass("sorttable_nosort");
			});
			/*
			showView("queue", function() {
				$(".main_list").colResizable({
					liveDrag: true,
					minWidth: 70
				});
			});
			*/
			break;
	}
});

$(".main_list")[0].addEventListener('contextmenu', function(event) {
	var clicked = event.srcElement;
	var parent = clicked.parentElement;

	if($(parent).hasClass("list_row")) {
		setActiveRow($(parent));
		ipcRenderer.send('listRowContextMenu', $(parent).attr("file"));
		/*
		setActiveRow($(parent));
		var menu = new Menu();

		menu.append(new MenuItem({
			label: 'Play Next',
			click() {
				console.log("play next clicked");
				queue.splice(current_queue+1, 0, $(parent).attr("file"));
			}
		}));

		menu.append(new MenuItem({
			label: 'Play Last',
			click() {
				console.log("play last clicked");
				queue.splice(queue.length, 0, $(parent).attr("file"));
			}
		}));

		menu.append(new MenuItem({type: 'separator'}));

		menu.append(new MenuItem({
			label: 'Refresh Cached Data',
			click() {
				console.log("refresh clicked");
			}
		}));		

		setTimeout(function() { menu.popup(remote.getCurrentWindow()); }, 1);
		*/
	}

    return false;
}, false);

if(settings.enable.mpris) {
	const MprisService = require('mpris-service');
	var mpris = MprisService({
		name: 'Electromeda',
		identity: 'Electromeda media player',
		supportedInterfaces: ['player'],
		supportedUriSchemes: ['file'],
		supportedMimeTypes: ['audio/mpeg', 'audio/flac', 'audio/vorbis', 'audio/wma'],
		minimumRate: 1,
		maximumRate: 1
	});

	var mpris_events = ['raise', 'quit', 'next', 'previous', 'pause', 'playpause', 'play', 'seek', 'position', 'volume'];
	mpris_events.forEach(function(event) {
		mpris.on(event, function(data) {
			console.log("mpris: " + event + " -- " + data);
		});
	});

	mpris.on('next', function() {
		playNextInQueue();
	});

	mpris.on('previous', function() {
		if(okToRestartPlayback()) {
			audio.element.currentTime = 0;
		} else {
			goBackInQueue();	
		}	
	})

	mpris.on('playpause', function() {
		togglePlaybackState();
	});

	exports.mpris = mpris;
}