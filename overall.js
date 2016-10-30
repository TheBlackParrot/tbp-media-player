const remote = require('electron').remote;
const fs = require('fs');
const audioMetadata = require('musicmetadata');
const audio = require('./audio.js');
exports.audio = audio;
const bottom = require('./bottom.js');
exports.bottom = bottom;
const dir = require('node-dir');

var util = require('./util.js');
exports.util = util;

const localStorage = window.localStorage;

var music_dir = "/mnt/remote/music";
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

		console.log("checking for callback");
		if(typeof callback === "function") {
			console.log("exists");
			callback(files);
		}
	});
}
exports.loadAllFiles = loadAllFiles;

function fetchMetadata(file, stream) {
	var cached = localStorage.getItem(file);
	if(cached) {
		all_files[file] = JSON.parse(cached);
		$(".main_list").append(createListElement(all_files[file], file));
	} else {
		if(!stream) {
			var stream = fs.createReadStream(file);
		}

		var parser = audioMetadata(stream, { duration: true }, function(err, metadata) {
			if(err) throw err;

			delete metadata.picture;
			all_files[file] = metadata;
			localStorage.setItem(file, JSON.stringify(metadata));

			$(".main_list").append(createListElement(metadata, file));
			console.log(metadata);
			console.log(file);
			console.log(stream);

			stream.close();
		});
	}
}

function showMainLibrary(callback) {
	for(var file in all_files) {
		fetchMetadata(file);
	}

	if(typeof callback === "function") {
		callback();
	}
}
exports.showMainLibrary = showMainLibrary;

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

function clearList(callback) {
	$(".main_list").empty();
	$(".main_list").html('<tr><td>Title</td><td>Artist</td><td>Album</td><td>Length</td></tr>');

	if(typeof callback === "function") {
		callback();
	}
}
exports.clearList = clearList;

function createListElement(metadata, file) {
	var row = $('<tr class="list_row"></tr>');
	row.attr("file", file);

	var title_element = $('<td></td>');
	title_element.text(metadata.title);
	title_element.attr("title", metadata.title);

	var artist_element = $('<td></td>');
	artist_element.text(metadata.artist.join(", "));
	artist_element.attr("title", metadata.artist.join(", "));

	var album_element = $('<td></td>');
	album_element.text(metadata.album);
	album_element.attr("title", metadata.album);

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

$(".main_list").off("click").on("click", ".list_row", function(event) {
	var file = $(this).attr("file");
	console.log("clicked " + file);

	if($(this).hasClass("row_selected")) {
		resetQueue();
		populateQueue();
		queue.splice(0, 0, file);

		audio.playAudio(file);
	} else {
		$(".row_selected").removeClass("row_selected");
		$(this).addClass("row_selected");
	}
});

$("#play-button").on("click", function(event) {
	console.log("clicked play button");
	event.stopPropagation();

	var symbol = $("#play-button i");

	if(symbol.hasClass("fa-play")) {
		audio.element.play();
		symbol.removeClass("fa-play").addClass("fa-pause");
	} else {
		audio.element.pause();
		symbol.removeClass("fa-pause").addClass("fa-play");
	}
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

$("#prev-button").on("click", function(event) {
	event.stopPropagation();

	if(okToRestartPlayback()) {
		audio.element.currentTime = 0;
	} else {
		if(!queue.length) {
			return;
		}

		current_queue--;
		if(current_queue < 0) {
			current_queue = queue.length-1;
		}
		audio.playAudio(queue[current_queue]);		
	}
});

function resetVolume() {
	var vol = localStorage.getItem("volume");

	if(vol != null) {
		audio.volume = parseFloat(vol);
		$("#volume").val(vol*100);
	}
}
exports.resetVolume = resetVolume;