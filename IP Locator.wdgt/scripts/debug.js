/**
 * Debugging functions that work for both strings and objects in both widget and browser environs
 */
var DEBUG;
DEBUG = (function () {
	var _startTime, _elapsedTime;
	_elapsedTime = 0;
	return {
		write: function (s) {
			alert('----------------------------------------------------------');
			alert(s);
		},
		reveal: function (o) {
			for (p in o) {
				if ('function' !== typeof o[p]) {
					DEBUG.write(p + ': ' + o[p]);
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
