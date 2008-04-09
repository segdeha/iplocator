/*

Copyright (c) 2005. All Rights reserved.

If you use this script, please email me and let me know, thanks!

Andrew Hedges
andrew (at) hedges (dot) name

If you want to hire me to write JavaScript for you, see my resume.

http://andrew.hedges.name/resume/

*/

// declare global variables
//	var debug = true;
var debug = false;

var ipObj;
var msgObj;
var countryObj;
var flagObj;
var cityObj;
var currencyObj;

var ipURL		= 'http://www.whatismyip.com/';
//var locatorURL	= 'http://www.dnsstuff.com/tools/widget.ch?ip=';
var locatorURL	= 'http://api.hostip.info/?position=true&ip=';
var locationHTML;
var currentMsg;

// IP and hostname regular expressions
var ipRgxp = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
var hnRgxp = /((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

var flags = ' ad ae af ag ai al am  an ao aq ar as at au aw az ba bb bd be bf bg bh bi bj bm bn bo br bs bt bv bw by bz ca cd cf cg ch ci ck cl cm cn co cr cu cv cy cz de dj dk dm do dz ec ee eg er es et eu fi fj fk fm fo fr ga gb gd ge gh gi gl gm gn gp gq gr gt gu gw gy hk hm hn hr ht hu id ie il im in io iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nz om pa pe pf pg ph pk pl pm pr ps pt pw py qa re ro ru rw sa sb sc sd se sg si sk sl sm sn so sr st sv sy sz tc td tf tg th tj tm tn to tp tr tt tv tw tz ua ug uk um us uy uz va vc ve vg vi vn vu ws ye yu za zm zr zw ';

var msgs = new Array();

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

function init() {
	if (debug) document.getElementById("debug").style.display = "block";
	
	ipObj		= getObj('ip');
	msgObj		= getObj('msg');
	countryObj	= getObj('country');
	flagObj		= getObj('flag');
	cityObj		= getObj('city');
	currencyObj	= getObj('currency');
	
	displayMsg('default');
	
	// get IP
	loadXML(ipURL);
	
	createGenericButton(document.getElementById('doneButton'), 'Done', null);
}

function locateIt() {
	displayMsg('loading');
	
	countryObj.innerHTML	= '';
	cityObj.innerHTML		= '';
	flagObj.src				= 'images/flags/-.gif';
	currencyObj.innerHTML	= '';
	
	var ip = ipObj.value;
	var isValid = validateIP(ip);
	
	if (isValid) {
		var url = locatorURL + ip;
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
	xmlRequest.open('GET',url,true);
	xmlRequest.setRequestHeader('Cache-Control', 'no-cache');
	xmlRequest.send(null);
}

function processRequestChange() {	
	if (null == xmlRequest.readyState) return;
	if (xmlRequest.readyState == 4) {
		if (xmlRequest.status == 200) {		
			if (debug) writeDebug('xmlRequest.url = '+xmlRequest.url);
			
			if (xmlRequest.url.indexOf('dnsstuff') > -1) {
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
	displayMsg('loaded');
	
	if (null == xmlRequest.responseXML) {
		displayMsg('emptyfeed');
	} else {
		xml = xmlRequest.responseXML;
		
		error = xml.getElementsByTagName('error');
		
		// is there an error tag?
		if (error.length > 0) {
			// error
			displayMsg('nomatch');
		} else {
			country		= xml.getElementsByTagName('countryName')[0].firstChild.nodeValue;
			countrycode	= xml.getElementsByTagName('countryAbbrev')[0].firstChild.nodeValue;
			city		= xml.getElementsByTagName('gml:name')[0].firstChild.nodeValue;
//			currency	= xml.getElementsByTagName('currency')[0].firstChild.nodeValue;
				latitude	= xml.getElementsByTagName('gml:coordinates')[0].firstChild.nodeValue.split(',')[0];
				longitude	= xml.getElementsByTagName('gml:coordinates')[0].firstChild.nodeValue.split(',')[1];
			
			if (country[0].firstChild) {
				countryObj.innerHTML = country;
				if (countrycode) {
					countryObj.innerHTML += ' (' + countrycode + ')';
					var flag = countrycode.toLowerCase();
					if (flags.indexOf(' '+flag+' ') > -1) {
						flagObj.src = 'images/flags/' + countrycode.toLowerCase() + '.gif';
					} else {
						flagObj.src = 'images/flags/-.gif';
					}
				}
			} else {
				countryObj.innerHTML = 'No match';
			}
			
			cityObj.innerHTML		= (city)? city : 'No Match';
//			currencyObj.innerHTML	= (currency[0].firstChild)? currency[0].firstChild.nodeValue : 'No Match';
		}
	}
}

function parseIP() {
	if (null == xmlRequest.responseText) {
		displayMsg('emptyfeed');
	} else {
		html = xmlRequest.responseText;
		
		// <TITLE>Your IP Is 64.106.63.218 WhatIsMyIP.com</TITLE>
		// <TITLE>Your IP  - 66.193.204.253 WhatIsMyIP.com</TITLE>
		
		start = html.indexOf('<TITLE>');
		if (start < 0) start = html.indexOf('<title>');
		
		end = html.indexOf('<\/TITLE>');
		if (end < 0) end = html.indexOf('<\/title>');
		
		titleString = html.substring(start,end);
		
//		alert("titleString = "+titleString);
//		alert("ipRgxp = "+ipRgxp);
		
		var ip = titleString.match(ipRgxp);
		
//		alert('ip = '+ip);
		
//		if (!ip) ip = titleString.match(hnRgxp);
		
//		var ip = html.substring(start+18,end);
		
		if (ip && validateIP(ip[0])) {
			ipObj.value = ip[0];
			ipObj.select();
		} else {
			displayMsg('invalidip');
		}
	}
}

/*************************************/
/* begin: version checking functions */
function doCheckVersion() {
	// figure out whether we have a 'net connection
//	var ip = window.widget.system('ifconfig | grep "inet " | grep -v 127.0.0.1 | cut -d\\  -f2',null).outputString;
	var msg;
	
//	if (!!ip) {
		checkVersion('iplocator');
		msg = 'Checking for Updates&#8230;';
/*	} else {
		msg = 'Error: '+version_errors['-2'];
	}*/
	
	var vrsnObj = getObj('versioning');
	vrsnObj.innerHTML = msg;
}

function returnVersion(vrsn) {
	///////////////////////////////////////
	// WIDGET VERSION: UPDATE EACH VERSION!
	
	var thisvrsn = '1.5';
	var msg;
	
	if (thisvrsn == vrsn) { // up-to-date
		msg = 'This widget is up-to-date.';
	} else {
		if (vrsn.indexOf('-') > -1) { // error
			msg = 'Error: '+version_errors[vrsn];
		} else { // new version available
			msg = '<span class="link" onclick="gotoURL(\'http://andrew.hedges.name/widgets/#makeapass\');vrsnMsgBlank();">New version available.<\/span>';
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

// /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


function validateIP(ip) {
//	alert(ip);
	
	var isValid = true;
	
	// validate the IP address
//	var ipRgxp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
//	var hnRgxp = /^((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	
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

// DEBUGGING FUNCTION
function writeDebug(s) {
	if (window.widget) {
		alert(s);
	} else {
		document.getElementById('debug').innerHTML += s + '<br \/>\n';
	}
}
