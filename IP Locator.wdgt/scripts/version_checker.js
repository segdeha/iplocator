/*

ajax version checker, 1.0
written by andrew hedges, andrew at hedges dot name

you may use this script with permission from the email address above.
you will need your own version of version.php. write me for a copy of
the script i'm using.

usage:

current = checkVersion(string widgetname, string widgetversion);

returns string version number or error code, as follows:

-1		no version number available
-2		no connection
-3		empty page

*/

var httpRequest;
var wdgtversion;

var version_errors = new Array();
version_errors['-1'] = 'No match';
version_errors['-2'] = 'No connection';
version_errors['-3'] = 'No result';

function checkVersion(wdgtname) {
	var url = 'http://andrew.hedges.name/widgets/version.php?widget='+wdgtname+'&nocache='+(new Date()).getTime();
	httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = processChange;
	httpRequest.open('GET',url,true);
	httpRequest.setRequestHeader('Cache-Control', 'no-cache');
	httpRequest.setRequestHeader('If-Modified-Since','Sat, 29 Jul 1972 00:00:00 GMT');
	httpRequest.send(null);
}

function processChange() {
	if (null == httpRequest.readyState) return;
	if (httpRequest.readyState == 4) {
		if (httpRequest.status == 200) {
			if (null == httpRequest.responseText) {
				wdgtversion = '-3'; // empty page
			} else {
				wdgtversion = httpRequest.responseText;
			}
		} else {
			if (null == httpRequest.status) return;
			wdgtversion = '-2'; // no connection
		}
		returnVersion(wdgtversion);
	}
}
