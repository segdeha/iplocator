/**
 * Debugging functions that work for both strings and objects in both widget and browser environs
 */
var DEBUG;
DEBUG = (function () {
	var _defaultHTML, _init, _startTime, _elapsedTime;
	_defaultHTML = '<a href="#" onclick="DEBUG.clear();return false;">Clear</a><hr/>';
	_elapsedTime = 0;
	_init = function () {
		var debugDiv;
		if ('undefined' === typeof WW) {
			debugDiv = document.getElementById('debug');
			if (!debugDiv) {
				debugDiv	= document.createElement('DIV');
				debugDiv.id = 'debug';
				document.body.insertBefore(debugDiv, document.body.firstChild);
				DEBUG.clear();
			}
		}
	};
	return {
		writeDebug: function (s) {
			alert('----------------------------------------------------------');
			alert(s);
		},
		revealObject: function (o) {
			for (p in o) {
				if ('function' !== typeof o[p]) {
					DEBUG.writeDebug(p + ': ' + o[p]);
				}
			}
        },
        startTimer: function () {
            _startTime = (new Date()).getTime();
		},
		markTime: function () {
			_elapsedTime = ((new Date()).getTime()) - _startTime;
		},
		getElapsedTime: function () {
			return (_elapsedTime > 0)? _elapsedTime : 0;
		}
	}
})();
