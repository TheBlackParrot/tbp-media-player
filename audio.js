var main = require('./overall.js');

var util = require('./util.js');

var element = $("#audio")[0];
var element_src = $("#audio_src");
exports.element = element;

var context = new AudioContext();
var source = context.createMediaElementSource(element);

var gainNode = context.createGain();

function setVolume(vol) {
	gainNode.gain.value = vol;
}
exports.setVolume = setVolume;

/*
var analyser = context.createAnalyser();
exports.analyser = analyser;
analyser.fftSize = 2048;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
*/

source.connect(gainNode);
//gainNode.connect(analyser);
//analyser.connect(context.destination);
gainNode.connect(context.destination);

var pb_interval;

exports.playAudio = function(file) {
	element.pause();
	element_src.attr("src", file);
	element.load();

	element.onprogress = function() {
		element.play();
	}

	element.onplaying = function() {
		$("#duration").text(util.getTimeStr(element.duration));
	}

	element.onplay = function() {
		var metadata = main.all_files[file];

		clearInterval(pb_interval);
		pb_interval = setInterval(function() {
			var progress = (element.currentTime / element.duration)*100;
			$(".progress").css("width", progress + "%");

			$("#elapsed").text(util.getTimeStr(element.currentTime));

			var metadata = main.all_files[file];
			document.title = metadata.artist + " - " + metadata.title;

			// Disabling until https://github.com/emersion/mpris-service/issues/1 can be fixed
			//main.mpris.position = element.currentTime * 1000 * 1000;
		}, 500);

		updateNowPlayingInList(file);

		main.bottom.updateDetails(metadata);
		main.bottom.updateArt(file, function() {
			/* TODO: move all mpris related events to a seperate script */
			main.mpris.metadata = {
				'mpris:trackid': main.mpris.objectPath('CurrentTrack'),
				'mpris:length': element.duration * 1000 * 1000,
				'mpris:artUrl': 'file://' + main.tmpArt,
				'xesam:title': metadata.title,
				'xesam:artist': metadata.artist,
				'xesam:album': metadata.album,
				'xesam:url': 'file://' + file
			}

			$(element).trigger("startPlaying", [main.all_files[file]]);
		});

		$(".details").css("opacity", "1");

		$("#play-button i").removeClass("fa-play").addClass("fa-pause");

		/* TODO: move all mpris related events to a seperate script */
		main.mpris.playbackStatus = 'Playing';
	}

	element.onended = function() {
		main.playNextInQueue();
		console.log("ended");
		clearInterval(pb_interval);
	}
};

function updateNowPlayingInList(file) {
	$(".row_playing .list_play").remove();
	$(".row_playing").removeClass("row_playing");

	$("#current-file").attr("data-file", file);

	$('.list_row[file="' + file + '"]').addClass("row_playing");
	var _ = $('.list_row[file="' + file + '"] td:first-child').prepend('<i class="fa fa-play list_play" aria-hidden="true"></i> ');
	if(_.hasClass("row_selected")) {
		_.addClass("inverse-text");
	}
}
exports.updateNowPlayingInList = updateNowPlayingInList;

/*
var canvas = $("#canvas")[0];
var canvasCtx = canvas.getContext('2d');
canvasCtx.fillStyle = "rgb(255,255,255)";

var WIDTH = 128;
var HEIGHT = 64;

function draw() {
	drawVisual = requestAnimationFrame(draw);

	analyser.getByteTimeDomainData(dataArray);

	canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

	canvasCtx.lineWidth = 2;
	canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
	canvasCtx.beginPath();

	var sliceWidth = WIDTH * 1.0 / bufferLength;
	var x = 0;

	for(var i = 0; i < bufferLength; i++) {
		var v = dataArray[i] / WIDTH;
		var y = v * HEIGHT/2;

		if(i === 0) {
			canvasCtx.moveTo(x, y);
		} else {
			canvasCtx.lineTo(x, y);
		}

		x += sliceWidth;
	}

	canvasCtx.lineTo(canvas.width, canvas.height/2);
	canvasCtx.stroke();
}
draw();
*/