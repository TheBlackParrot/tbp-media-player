function getTimeStr(sec) {
	sec = Math.floor(sec);

	var fsec = sec % 60;
	if(fsec <= 9) {
		fsec = ("0" + fsec).slice(-2);
	}

	return Math.floor(sec/60) + ":" + fsec;
}
exports.getTimeStr = getTimeStr;

function getRandom(min, max) {
	return Math.floor(Math.random() * ((max+1) - min)) + min;
}
exports.getRandom = getRandom;