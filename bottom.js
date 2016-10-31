const audioMetadata = require('musicmetadata');
const audio = require('./audio.js');

function updateArt(file) {
	var stream = fs.createReadStream(file);

	var parser = audioMetadata(stream, function(err, metadata) {
		if(err) {
			$(".art").hide();
			throw err;
			return;
		}
		
		try {
			var b64 = new Buffer(metadata.picture[0].data.toString('base64'));
		} catch(err) {
			$(".art").hide();
			throw err;
			return;
		}

		$(".art").show();
		$("#art").attr("src", "data:image/" + metadata.picture[0].format + ";base64," + b64);
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