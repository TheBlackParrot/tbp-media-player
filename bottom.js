const audioMetadata = require('musicmetadata');
const audio = require('./audio.js');
const main = require('./overall.js');
const fs = require('fs');

function updateArt(file, callback) {
	var stream = fs.createReadStream(file);

	var parser = audioMetadata(stream, function(err, metadata) {
		try {
			// tmp doesn't seem to clean itself up?
			fs.unlink(main.tmpArt);
		} catch(err) {
			// do nothing
		}

		if(err) {
			$(".art").hide();
			throw err;
			return;
		}
		
		var b64 = null;
		try {
			var b64 = new Buffer(metadata.picture[0].data.toString('base64'));
		} catch(err) {
			$(".art").hide();
			console.warn("Couldn't load art: " + err);
		}

		var art = main.tmp.fileSync({
			mode: 0644,
			prefix: '.',
			postfix: '.' + (typeof metadata.picture[0] !== "undefined" ? metadata.picture[0].format : 'png')
		});

		if(b64) {
			var art_data = metadata.picture[0].data;
		} else {
			var art_data = fs.readFileSync('./icon.png');
		}

		try {
			fs.writeFileSync(art.name, art_data);
			main.tmpArt = art.name
		} catch(err) {
			console.warn("Unable to write art to temporary file");
		}

		if(b64) {
			$(".art").show();
			$("#art").attr("src", "data:image/" + metadata.picture[0].format + ";base64," + b64);
		}

		if(typeof callback === "function") {
			callback();
		}
	});
}
exports.updateArt = updateArt;

function updateDetails(data) {
	$("#title").text(data.title);
	$("#artist").text(data.artist.join(", "));
	$("#album").text(data.album);
}
exports.updateDetails = updateDetails;

var pb_interval;
function start_pb() {
	pb_interval = setInterval(function() {
		$(".progress").css("width", ($("#audio")[0].currentTime / $("#audio")[0].duration)*100 + "%");
	}, 500);
}
exports.start_pb = start_pb;

function stop_pb() {
	$("#audio")[0].onended = function() {
		clearInterval(pb_interval);
	}
}
exports.stop_pb = stop_pb;

$(".progress_bg").mouseenter(function() {
	$(this).css("transform", "translateY(0px)");
	$(".progress").css("transform", "translateY(0px)");
}).mouseleave(function() {
	$(this).css("transform", "translateY(13px)");
	$(".progress").css("transform", "translateY(13px)");	
});

$(".progress_bg").on("click", function(event) {
	console.log(event);

	var seek = (event.clientX / $(this).width()) * audio.element.duration;
	audio.element.currentTime = seek;
});