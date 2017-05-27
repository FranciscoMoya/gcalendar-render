var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
var MILLISECONDS_IN_A_WEEK = 432000000

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var semesterSelect = document.getElementById('semester-select');
var helpText = document.getElementById('help-text');

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    if (window['CLIENT_ID'] === undefined)
        helpText.style.display = 'block';
    
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = _ => { gapi.auth2.getAuthInstance().signIn(); };
        signoutButton.onclick   = _ => { gapi.auth2.getAuthInstance().signOut(); };
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        semesterSelect.style.display = 'block';
        displayCalendars();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function displayCalendars() {
    jQuery('.calendar').each( (i, e) => {
        var div = jQuery(e);
        div.html(calendarTemplate(div));
        displayCalendarEvents(div);
    });
}

function calendarTemplate(div) {
    return '<h2></h2><table>'+ weekTemplate(div) + '</table>';
}

function weekTemplate(div) {
    return headTemplate(['', 'L', 'M', 'X', 'J', 'V'])
        + bodyTemplate(weekRows(timeSlots(div)));
}

function bodyTemplate(l) {
    return l.join('');
}

function headTemplate(l) {
    return '<tr><th>' + l.join('</th><th>') + '</th></tr>';
}

function timeSlots(div) {
    var slots = [];
    var limits = div.attr('time').split('-');
    for (var t = limits[0]; t != limits[1] && slots.length < 20; t = nextSlot(t))
        slots.push(t);
    return slots;
}

function nextSlot(t) {
    var h = 1 + parseInt(t.substr(0,2));
    return ('00' + h.toString()).slice(-2) + t.slice(-3);
}

function weekRows(l) {
    var r = [];
    l.forEach( (s) => { r.push(rowTemplate([s,'','','','',''])); } );
    return r;
}

function rowTemplate(l) {
    return '<tr><td class="hour">' + l.join('</td><td>') + '</td></tr>';
}

function displayCalendarEvents(div) {
    var id = div.attr('calid');
    var hour2row = buildHour2Row(div);
    var start = new Date(div.attr('date'));
    var end = new Date();
    end.setTime(start.getTime() + MILLISECONDS_IN_A_WEEK);
    displayTitle(div, id);
    gapi.client.calendar.events.list({
        'calendarId': id + '@group.calendar.google.com',
        'timeMin': start.toISOString(),
        'timeMax': end.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime'
    }).then(function(response) {
        var events = response.result.items;
        if (events.length > 0) {
            for (i = 0; i < events.length; i++) {
                displayEvent(div, events[i], hour2row);
            }
        }
    });
}

function buildHour2Row(div) {
    var d = {};
    div.find('.hour').each( (i,v) => { d[v.innerText] = 1+i; });
    return d;    
}

function displayTitle(div) {
    var id = div.attr('calid');
    gapi.client.calendar.calendars.get({
        'calendarId': id + '@group.calendar.google.com'
    }).then(function(response) {
        var title = div.find('h2');
        title.html(response.result.summary);
    });
}

function displayEvent(div, event, hour2row) {
    var id = div.attr('calid');
    var start = event.start.dateTime.substr(11,5);
    var end = event.end.dateTime.substr(11,5);
    var day = parseInt(event.start.dateTime.substr(8,2)) - 11 + 1;
    var hour = hour2row[start];
    var span = parseInt(end.substr(0,2)) - parseInt(start.substr(0,2));

    if (hour === undefined) return;
    
    var box = div.find('table tr:eq('+ hour.toString() +') td:eq(' + day.toString() + ')');
    box.empty();
    box.html('<div class="subject">' + event.summary + '</div>'
             + '<div class="room">' + event.location + '</div>'
             + '<div class="instructor">' + event.description.replace(/\n/g,'<br/>') + '</div>' );
    box.attr('rowspan', span.toString());
    box.show()
}
