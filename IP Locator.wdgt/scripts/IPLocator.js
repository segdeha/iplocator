/*

Copyright (c) 2005 - 2008. All Rights reserved.

If you use this script, please email me and let me know, thanks!

Andrew Hedges
andrew (at) hedges (dot) name

If you want to hire me to write JavaScript for you, see my resume.

http://andrew.hedges.name/resume/

*/

String.prototype.toTitleCase = function () {
	var pieces;
	pieces = this.split(' ');
	for (var i = 0, len = pieces.length; i < len; ++i) {
		pieces[i] = pieces[i].substr(0, 1).toUpperCase() + pieces[i].substr(1).toLowerCase();
	}
	return pieces.join(' ');
};

var WW, IPLOCATOR;

WW = window.widget;

IPLOCATOR = (function () {
	// constants
	var WHATISMYIP, HOSTIP, GEOIO, IP, HN, DFAULT, LOADING, LOADED, FLIP, SNAP, NOCONNECTION, EMPTYFEED, INVALIDIP, ERROR, NOMATCH, DASH, API;
	WHATISMYIP = 'whatismyip';
	HOSTIP     = 'hostip';
	GEOIO      = 'geoio';
	IP         = 'ip';
	HN         = 'hn';
	DFAULT     = 'dfault';
	LOADING    = 'loading';
	LOADED     = 'loaded';
	FLIP       = 'flip';
	SNAP       = 'snap';
	NOCONN     = 'noconn';
	EMPTYFEED  = 'emptyfeed';
	INVALIDIP  = 'invalidip';
	ERROR      = 'error';
	NOMATCH    = 'nomatch';
	DASH       = '-';
	API        = 'api';
	UNKNOWNCC  = 'XX';
	// private variables
	var _api, _urls, _rgxps, _flags, _msgs, _noMatchLink, _lastMsgKey, _elements;
	_urls = {
		whatismyip : 'http://www.whatismyip.com/automation/n09230945.asp',
		hostip     : 'http://api.hostip.info/?position=true&ip=',
		geoio      : 'http://api.geoio.com/q.php?key=meJ4HHJIbvGKIJEZ&qt=geoip&d=pipe&q='
	};
	_rgxps = {
		ip : /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
		hn : /((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/
	};
	_flags = ' ad ae af ag ai al am  an ao aq ar as at au aw az ba bb bd be bf bg bh bi bj bm bn bo br bs bt bv bw by bz ca cd cf cg ch ci ck cl cm cn co cr cu cv cy cz de dj dk dm do dz ec ee eg er es et eu fi fj fk fm fo fr ga gb gd ge gh gi gl gm gn gp gq gr gt gu gw gy hk hm hn hr ht hu id ie il im in io iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nz om pa pe pf pg ph pk pl pm pr ps pt pw py qa re ro ru rw sa sb sc sd se sg si sk sl sm sn so sr st sv sy sz tc td tf tg th tj tm tn to tp tr tt tv tw tz ua ug uk um us uy uz va vc ve vg vi vn vu ws ye yu za zm zr zw ';
	_msgs  = {
		// status
		dfault  : '<div class="message">Enter an IP address above</div>',
		loading : '<div class="message">Status: Contacting server</div>',
		loaded  : '<div class="message">Status: Done</div>',
		flip    : '<div class="message">Click to flip widget over</div>',
		snap    : '<div class="message">Click to fetch your IP</div>',
		// error
		noconn    : '<div class="error">Error: Unable to complete request</div>',
		emptyfeed : '<div class="error">Error: Request returned empty</div>',
		invalidip : '<div class="error">Error: Invalid address</div>',
		error     : '<div class="error">Error: Unknown Error</div>',
		nomatch   : '<div class="error">Error: No match</div>'
	};
	_noMatchLink = '<span class="link" onclick="WW.openURL(\'http://www.hostip.info/correct.php?fd=correctFinished.html&spip=%s\');">Add location to HostIP.info</span>';
	// private methods
	var _displayMsg, _revertMsg, _makeRequest, _processResponse, _processHostIP, _processGeoIO, _parseIP, _validateIP;
	_displayMsg = function (key, noSave) {
		if (!noSave) _lastMsgKey = key;
		_elements.msg.innerHTML = _msgs[key];
	};
	_revertMsg = function () {
		_displayMsg(_lastMsgKey, false);
	};
	_makeRequest = function (url) {
		var xhr, onStateChange;
		onStateChange = function () {
			if (null == xhr.readyState) return;
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					_processResponse(xhr);
				} else {
					if (null == xhr.status) return;
					_displayMsg(NOCONN);
				}
			}
		};
		xhr = new XMLHttpRequest();
		xhr.onreadystatechange = onStateChange;
		xhr.url = url;
		xhr.open('GET', url, true);
		xhr.setRequestHeader('Cache-Control', 'no-cache');
		xhr.send(null);
	};
	_processResponse = function (xhr) {
		var txt;
		txt = xhr.responseText;
		if (xhr.url === _urls.whatismyip) {
			_parseIP(txt);
		} else {
			if ('' === txt) {
				displayMsg(EMPTYFEED);
			} else {
				switch (_api) {
					case HOSTIP:
						_processHostIP(txt);
						break;
					case GEOIO:
						_processGeoIO(txt);
						break;
				}
			}
		}
	};
	_processHostIP = function (txt) {
		var rgxps, coordsNA, unknownCountry, unknownCity, values;
		rgxps = {
			country     : /countryName>(.*)<\/countryName/,
			countrycode : /countryAbbrev>(.*)<\/countryAbbrev/,
			city        : /<Hostip>\s*<gml:name>(.*)<\/gml:name>\s*<countryName>/,
			latLng      : /gml:coordinates>(.*)<\/gml:coordinates/
		};
		coordsNA           = 'Co-ordinates are unavailable';
		unknownCountry     = 'Unknown Country';
		unknownCity        = 'Unknown City';
		if (txt.indexOf(unknownCountry) > -1) {
			// error
			_displayMsg(NOMATCH);
			if (HOSTIP === _api) {
				_elements.link.innerHTML = _noMatchLink.replace(/\%s/, _elements.ip.value);
			}
		} else {
			country     = txt.match(rgxps.country)[1];
			countrycode = txt.match(rgxps.countrycode)[1];
			city        = txt.match(rgxps.city)[1];
			values = {
				country     : (country.indexOf(unknownCountry) > -1)? false : country,
				countrycode : countrycode,
				city        : (city.indexOf(unknownCity) > -1)?       false : city,
				latitude    : (txt.indexOf(coordsNA) > -1)?           false : txt.match(rgxps.latLng)[1].split(',')[0],
				longitude   : (txt.indexOf(coordsNA) > -1)?           false : txt.match(rgxps.latLng)[1].split(',')[1]
			};
			_displayValues(values);
		}
	};
	_processGeoIO = function (txt) {
	    // 0        1        2           3                           4       5
	    // city     state    country                                 lat     lng
		// Auckland|Auckland|New Zealand|Worldxchange Communications|-36.867|174.767
		var pieces;
		pieces = txt.split('|');
		values = {
			country     : (DASH === pieces[2])? false : pieces[2],
			countrycode : CountryCodes[pieces[2]] || UNKNOWNCC,
			city        : (DASH === pieces[0])? false : pieces[0],
			latitude    : (DASH === pieces[4])? false : pieces[4],
			longitude   : (DASH === pieces[5])? false : pieces[5]
		};
		if (false === values.country) {
			_displayMsg(NOMATCH);
		} else {
			_displayValues(values);
		}
	};
	_displayValues = function (values) {
		var flag;
		flag = values.countrycode.toLowerCase();
		_elements.country.innerHTML = (values.country)? values.country.toTitleCase() : '';
		if (UNKNOWNCC !== values.countrycode) {
			_elements.country.innerHTML += ' (' + values.countrycode + ')';
			if (_flags.indexOf(' ' + flag + ' ') > -1) {
				_elements.flag.src = 'images/flags/' + flag + '.gif';
			} else {
				_elements.flag.src = 'images/flags/-.gif';
			}
		}
		
		_elements.city.innerHTML = values.city || 'No Match';
		
		if (values.latitude && values.longitude) {
			_elements.link.innerHTML = '<span class="link" onclick="WW.openURL(\'http://maps.google.com/maps?q=' + values.latitude + ',' + values.longitude + '\');">Go here on Google Maps</span>';
		} else if (false !== values.city && HOSTIP === _api) {
			_elements.link.innerHTML = _noMatchLink.replace(/\%s/, _elements.ip.value);
		} else {
			_elements.link.innerHTML = '';
		}
		_displayMsg(LOADED);
	};
	_parseIP = function (ip) {
		if (null == ip) {
			displayMsg(EMPTYFEED);
		} else {
			if (ip && _validateIP(ip)) {
				_elements.ip.value = ip;
				_elements.ip.select();
			} else {
				_displayMsg(INVALIDIP);
			}
		}
	};
	_validateIP = function (ip) {
		var parts;
		if (_rgxps.ip.test(ip)) {
			parts = ip.split('.');
			if (parseInt(parseFloat(parts[0])) == 0) return false;
			for (var i = 0; i < parts.length; i++) {
				if (parseInt(parseFloat(parts[i])) > 255) return false;
			}
		} else {
			return false;
		}
		return true;
	};
	// public methods
	return {
		init: function () {
			var button;
			_elements = {
				ip      : document.getElementById('ip'),
				msg     : document.getElementById('msg'),
				country : document.getElementById('country'),
				flag    : document.getElementById('flag'),
				city    : document.getElementById('city'),
				link    : document.getElementById('link'),
				flip    : document.getElementById('flip'),
				snap    : document.getElementById('snap'),
				apiPref : document.getElementById('apiPref')
			};
			// flip rollie
			_elements.flip.onclick = showBack;
			_elements.flip.onmouseover = function (event) {
				enterflip(event);
				_displayMsg(FLIP, true);
			};
			_elements.flip.onmouseout = function (event) {
				exitflip(event);
				_revertMsg();
			};
			// ip snap
			_elements.snap.onclick = IPLOCATOR.getIP;
			_elements.snap.onmouseover = function (event) {
				entersnap(event);
				_displayMsg(SNAP, true);
			};
			_elements.snap.onmouseout = function (event) {
				exitsnap(event);
				_revertMsg();
			};
			_displayMsg(DFAULT);
			IPLOCATOR.getIP();
			IPLOCATOR.getApi();
			button = new AppleGlassButton(document.getElementById('doneButton'), 'Done', hideBack);
		},
		// Get the user's local IP address
		getIP: function () {
			_makeRequest(_urls.whatismyip);
		},
		// Get geolocation info for the IP address in the input field
		locate: function () {
			var ip, isValid, url;
			
			_displayMsg(LOADING);
			
			_elements.country.innerHTML = '';
			_elements.city.innerHTML    = '';
			_elements.flag.src          = 'images/flags/-.gif';
			_elements.link.innerHTML    = '';
			
			ip      = _elements.ip.value;
			isValid = _validateIP(ip);
			
			if (isValid) {
				url = _urls[_api] + ip;
				_makeRequest(url);
			} else {
				// not a valid IP address
				_displayMsg(INVALIDIP);
			}
		},
		// Set the API we're to use
		setApi: function () {
			_api = _elements.apiPref.options[_elements.apiPref.selectedIndex].value;
			PREFS.set(API, _api);
		},
		// Get the API we're to use from the user's prefs, alternately using the default
		getApi: function () {
			var api;
			api = PREFS.get(API);
			if (false !== api) {
				_api = api;
				for (var i = 0, len = _elements.apiPref.options.length; i < len; ++i) {
					if (_api === _elements.apiPref.options[i].value) {
						_elements.apiPref.selectedIndex = i;
						break;
					}
				}
			} else {
				_api = _elements.apiPref.options[_elements.apiPref.selectedIndex].value;
			}
		},
		focus: function () {
			_elements.ip.select();
		}
	};
})();

window.onload = IPLOCATOR.init;

// Manage user preferences
PREFS = (function () {
	// private methods
	var _generateUniqueKey;
	_generateUniqueKey = function (key) {
		var uniqueKey;
		uniqueKey = WW.identifier + '-' + key;
		return uniqueKey;
	};
	// public methods
	return {
		get: function (key) {
			var uniqueKey, val;
			uniqueKey = _generateUniqueKey(key);
			val       = WW.preferenceForKey(uniqueKey);
			return ('undefined' === typeof val)? false : val;
		},
		set: function (key, val) {
			var uniqueKey;
			uniqueKey = _generateUniqueKey(key);
			WW.setPreferenceForKey(val, uniqueKey);
		}
	};
})();

/*************************************/
/* begin: version checking functions */
function doCheckVersion() {
	var msg, vrsnObj;
	
	checkVersion('iplocator');
	msg = 'Checking for Updates&#8230;';
	
	vrsnObj = document.getElementById('versioning');
	vrsnObj.innerHTML = msg;
}

function returnVersion(vrsn) {
	///////////////////////////////////////
	// WIDGET VERSION: UPDATE EACH VERSION!
	
	var thisvrsn = '1.6';
	var msg;
	
	if (thisvrsn >= vrsn) { // up-to-date
		msg = 'This widget is up-to-date.';
	} else {
		if (vrsn.indexOf('-') > -1) { // error
			msg = 'Error: '+version_errors[vrsn];
		} else { // new version available
			msg = '<span class="link" onclick="WW.openURL(\'http://andrew.hedges.name/widgets/#iplocator\');vrsnMsgBlank();">New version available.<\/span>';
		}
	}
	
	var vrsnObj = document.getElementById('versioning');
	vrsnObj.innerHTML = msg;
}

function vrsnLinkRestore() {
	var vrsnObj = document.getElementById('versioning');
	vrsnObj.innerHTML = '<span class="link" onclick="doCheckVersion();">Check for updates.<\/span>';
}
/* end: version checking functions */
/***********************************/
