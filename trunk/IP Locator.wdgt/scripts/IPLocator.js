/*

Copyright (c) 2005 - 2008. All Rights reserved.

If you use this script, please email me and let me know, thanks!

Andrew Hedges
andrew (at) hedges (dot) name

If you want to hire me to write JavaScript for you, see my resume.

http://andrew.hedges.name/resume/

*/

// declare global variables
var IP, ipObj, msgObj, countryObj, flagObj, cityObj, currencyObj, ipURL, locatorURL, locationHTML, currentMsg, ipRgxp, hnRgxp, flags, msgs, nomatchlink;

ipURL		= 'http://www.whatismyip.com/automation/n09230945.asp';
locatorURL	= 'http://api.hostip.info/?position=true&ip=';

// IP and hostname regular expressions
ipRgxp = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
hnRgxp = /((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

flags = ' ad ae af ag ai al am  an ao aq ar as at au aw az ba bb bd be bf bg bh bi bj bm bn bo br bs bt bv bw by bz ca cd cf cg ch ci ck cl cm cn co cr cu cv cy cz de dj dk dm do dz ec ee eg er es et eu fi fj fk fm fo fr ga gb gd ge gh gi gl gm gn gp gq gr gt gu gw gy hk hm hn hr ht hu id ie il im in io iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nz om pa pe pf pg ph pk pl pm pr ps pt pw py qa re ro ru rw sa sb sc sd se sg si sk sl sm sn so sr st sv sy sz tc td tf tg th tj tm tn to tp tr tt tv tw tz ua ug uk um us uy uz va vc ve vg vi vn vu ws ye yu za zm zr zw ';

msgs = [];

// status messages
msgs["default"]			= '<div class="message">Enter an IP address above<\/div>';
msgs["loading"]			= '<div class="message">Status: Contacting server<\/div>';
msgs["loaded"]			= '<div class="message">Status: Done<\/div>';
msgs["flip"]			= '<div class="message">Click to flip widget over<\/div>';
msgs["snap"]			= '<div class="message">Click to fetch your IP<\/div>';

// error messages
msgs["noconnection"]	= '<div class="error">Error: Unable to complete request<\/div>';
msgs["emptyfeed"]		= '<div class="error">Error: Request returned empty<\/div>';
msgs["invalidip"]		= '<div class="error">Error: Invalid address<\/div>';
msgs["error"]			= '<div class="error">Error: Unknown Error<\/div>';
msgs["nomatch"]			= '<div class="error">Error: No match<\/div>';

nomatchlink = {
	start : '<span class="link" onclick="gotoURL(\'http://www.hostip.info/correct.php?fd=correctFinished.html&spip=',
	end   : '\');">Add address to HostIP.info</span>'
};

function init() {
	var button;
	
	ipObj		= getObj('ip');
	msgObj		= getObj('msg');
	countryObj	= getObj('country');
	flagObj		= getObj('flag');
	cityObj		= getObj('city');
	googleObj	= getObj('google-map');
	
	displayMsg('default');
	
	// get IP
	loadXML(ipURL);
	
	button = new AppleGlassButton(getObj('doneButton'), 'Done', hideBack);
}

function locateIt() {
	var isValid, url;
	
	displayMsg('loading');
	
	countryObj.innerHTML = '';
	cityObj.innerHTML    = '';
	flagObj.src          = 'images/flags/-.gif';
	googleObj.innerHTML  = '';
	
	IP = ipObj.value;
	isValid = validateIP(IP);
	
	if (isValid) {
		url = locatorURL + IP;
		loadXML(url);
	} else {
		// not a valid IP address
		displayMsg('invalidip');
	}
}

function loadXML(url) {
	xmlRequest = new XMLHttpRequest();
	xmlRequest.onreadystatechange = processRequestChange;
	xmlRequest.url = url;
	xmlRequest.open('GET', url, true);
	xmlRequest.setRequestHeader('Cache-Control', 'no-cache');
	xmlRequest.send(null);
}

function processRequestChange() {
	if (null == xmlRequest.readyState) return;
	if (xmlRequest.readyState == 4) {
		if (xmlRequest.status == 200) {
			if (xmlRequest.url.indexOf('hostip') > -1) {
				parseLocation();
			} else { // xmlRequest.url == ipURL
				parseIP();
			}
		} else {
			if (null == xmlRequest.status) return;
			displayMsg('noconnection');
		}
	}
}

function parseLocation() {
	var regexs, coordsNA, unknownCountry, txt, country, countrycode, city, latitude, longitude, flag;
	
	regexs = {
		country     : /countryName>(.*)<\/countryName/,
		countrycode : /countryAbbrev>(.*)<\/countryAbbrev/,
		city        : /<Hostip>\s*<gml:name>(.*)<\/gml:name>\s*<countryName>/,
		latLng      : /gml:coordinates>(.*)<\/gml:coordinates/
	};
	
	coordsNA       = 'Co-ordinates are unavailable';
	unknownCountry = 'Unknown Country?';
	
	displayMsg('loaded');
	
	if ('' === xmlRequest.responseText) {
		displayMsg('emptyfeed');
	} else {
		txt = xmlRequest.responseText;
		if (txt.indexOf(unknownCountry) > -1) {
			// error
			displayMsg('nomatch');
			googleObj.innerHTML = nomatchlink.start + IP + nomatchlink.end;
		} else {
			country = txt.match(regexs.country)[1];
			countrycode = txt.match(regexs.countrycode)[1];
			city = txt.match(regexs.city)[1];
			
			if (txt.indexOf(coordsNA) < 0) {
				latitude  = txt.match(regexs.latLng)[1].split(',')[0];
				longitude = txt.match(regexs.latLng)[1].split(',')[1];
			}
			
			if (country) {
				countryObj.innerHTML = country;
				if (countrycode) {
					countryObj.innerHTML += ' (' + countrycode + ')';
					flag = countrycode.toLowerCase();
					if (flags.indexOf(' '+flag+' ') > -1) {
						flagObj.src = 'images/flags/' + countrycode.toLowerCase() + '.gif';
					} else {
						flagObj.src = 'images/flags/-.gif';
					}
				}
			} else {
				countryObj.innerHTML = 'No match';
			}
			
			cityObj.innerHTML   = city || 'No Match';
			
			if (latitude && longitude) {
				googleObj.innerHTML = '<span class="link" onclick="gotoURL(\'http://maps.google.com/maps?q=' + longitude + ',' + latitude + '\');">Go here on Google Maps</span>';
			} else {
				googleObj.innerHTML = '';
			}
		}
	}
}

function parseIP() {
	var ip;
	if (null == xmlRequest.responseText) {
		displayMsg('emptyfeed');
	} else {
		ip = xmlRequest.responseText;
		if (ip && validateIP(ip)) {
			ipObj.value = ip;
			ipObj.select();
		} else {
			displayMsg('invalidip');
		}
	}
}

/*************************************/
/* begin: version checking functions */
function doCheckVersion() {
	var msg, vrsnObj;
	
	checkVersion('iplocator');
	msg = 'Checking for Updates&#8230;';
	
	vrsnObj = getObj('versioning');
	vrsnObj.innerHTML = msg;
}

function returnVersion(vrsn) {
	///////////////////////////////////////
	// WIDGET VERSION: UPDATE EACH VERSION!
	
	var thisvrsn = '1.5';
	var msg;
	
	if (thisvrsn >= vrsn) { // up-to-date
		msg = 'This widget is up-to-date.';
	} else {
		if (vrsn.indexOf('-') > -1) { // error
			msg = 'Error: '+version_errors[vrsn];
		} else { // new version available
			msg = '<span class="link" onclick="gotoURL(\'http://andrew.hedges.name/widgets/#iplocator\');vrsnMsgBlank();">New version available.<\/span>';
		}
	}
	
	var vrsnObj = getObj('versioning');
	vrsnObj.innerHTML = msg;
}

function vrsnLinkRestore() {
	var vrsnObj = getObj('versioning');
	vrsnObj.innerHTML = '<span class="link" onclick="doCheckVersion();">Check for updates.<\/span>';
}
/* end: version checking functions */
/***********************************/

// LIBRARY FUNCTIONS
function displayMsg(msgId,noSave) {
	// save the message ID to restore it, if needed
	if (!noSave) currentMsg = msgId;
	
	// display the message
	msgObj.innerHTML = msgs[msgId];
}

function changeMsg(id) {
	displayMsg(id,true);
}

function changeMsgBack() {
	displayMsg(currentMsg,false);
}

function gotoURL(url) {
	if (window.widget) {
		widget.openURL(url)
	} else {
		location.href = url;
	}
}

function validateIP(ip) {
	var isValid;
	isValid = true;
	
	if (ipRgxp.test(ip)) {
		var parts = ip.split(".");
		if (parseInt(parseFloat(parts[0])) == 0) { isValid =  false; }
		for (var i = 0; i < parts.length; i++) {
			if (parseInt(parseFloat(parts[i])) > 255) { isValid =  false; }
		}
	} else {
		isValid = false;
	}
	
	// if it's not a valid IP address, check to see if it's a hostname
	if (!isValid) {
		if (hnRgxp.test(ip)) {
			isValid = true;
		}
	}
	
	return isValid;
}

// No track/key timers should be running while Dashboard is hidden.
function getObj(id) {
	return document.getElementById(id);
}

// EVENT HANDLERS
window.onload = init;
