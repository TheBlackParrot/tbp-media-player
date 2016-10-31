const main = require('./overall.js');

// http://stackoverflow.com/a/11868398
function getContrastYIQ(hexcolor, inverse){
	hexcolor = hexcolor.replace("#", "");

	if(hexcolor.length == 3) {
		var tmp = hexcolor;
		hexcolor = tmp[0] + tmp[0] + tmp[1] + tmp[1] + tmp[2] + tmp[2];
	}

    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;

    console.log(hexcolor + " (" + (inverse ? 1 : 0) + "): " + yiq);
    return (yiq >= 128) ? main.settings.color.black : main.settings.color.white;
}

function setColor(main_color, bg_color) {
	if(!bg_color) {
		var bg_color = main.settings.color.background;
	}

	$("#standard-text-css").text(".standard-text { color: " + getContrastYIQ(bg_color) + "; }");
	$("#inverse-text-css").text(".inverse-text { color: " + getContrastYIQ(main_color) + "; }");
	$("#color-text-css").text(".color-text { color: " + main_color + "; }");

	$("#standard-bg-css").text(".standard-bg { background-color: " + bg_color + "; }");
	$("#inverse-bg-css").text(".inverse-bg, #volume::-webkit-slider-runnable-track, #volume::-webkit-slider-thumb { background-color: " + getContrastYIQ(main_color) + "; }");
	$("#color-bg-css").text(".color-bg { background-color: " + main_color + "; }");	
}
exports.setColor = setColor;

setColor(main.settings.color.primary);