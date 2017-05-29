var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
var MILLISECONDS_IN_A_WEEK = 432000000

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
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
    }).then(() => {
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
        displayCalendars();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function displayCalendars() {
    jQuery('.calendar').each( (i, e) => {
        var div = jQuery(e);
        var ids = div.attr('calids').split(' ');
        var dates = JSON.parse(div.attr('dates'));
        div.replaceWith(calendarPeriodSelector(renderAllCalendarPeriods(ids, dates)));
    });
}

function calendarPeriodSelector(periods) {
    var div = jQuery('<div/>').append(selectorWidget(periods));
    periods.forEach( p => { div.append(p); } );
    return div;
}

function selectorWidget(objs) {
    var sel = jQuery('<select/>');
    objs.forEach( (o,i) => { sel.append(jQuery('<option/>').attr('value', i).html(o.title)); });
    sel.change( _ => { showOnly(objs, sel.val()); });
    showOnly(objs, 0);
    return sel;
}

function showOnly(objs, selection) {
    objs.forEach( (o, i) => {
        if (i != selection) o.hide();
        else o.show();
    });
}

function renderAllCalendarPeriods(ids, dates) {
    var all = [];
    for (var period in dates) {
        var obj = calendarIdSelector(renderAllCalendars(ids, dates[period]));
        obj.title = period;
        all.push(obj);
    }
    return all;
}

function calendarIdSelector(cal) {
    var div = jQuery('<div/>');
    cal.forEach( c => { div.append(c); });
    return div;
}

function renderAllCalendars(ids, date) {
    var all = [];
    ids.forEach( id => {
        all.push(renderCalendar(id, date));
    });
    return all;
}

function renderCalendar(id, datestr) {
    var datetime = datestr.split(' ');
    var date = datetime[0];
    var time = datetime[1];
    return renderCalendarEvents(id, date, time);
}

function renderCalendarEvents(id, date, time) {
    var div = calendarTemplate(id, time);
    var hour2row = buildHour2Row(div);
    var start = new Date(date);
    var end = new Date();
    end.setTime(start.getTime() + MILLISECONDS_IN_A_WEEK);
    gapi.client.calendar.events.list({
        'calendarId': id + '@group.calendar.google.com',
        'timeMin': start.toISOString(),
        'timeMax': end.toISOString(),
        'showDeleted': false,
        'singleEvents': true
    }).then(response => {
        var events = response.result.items;
        for (var i = 0; i < events.length; i++) {
            displayEvent(div, events[i], hour2row);
        }
    });
    return div;
}

function calendarTemplate(id, time) {
    return jQuery('<div/>')
        .append(titleTemplate(id))
        .append(weekTemplate(time));
}

function titleTemplate(id) {
    return displayTitle(id, jQuery('<h2/>'));
}

function weekTemplate(time) {
    return jQuery('<table/>')
        .append(headTemplate(['', 'L', 'M', 'X', 'J', 'V']))
        .append(weekRows(timeSlots(time)));
}

function headTemplate(l) {
    var h = [];
    l.forEach(item => { h.push(jQuery('<th/>').html(item)); } );
    return jQuery('<tr/>').append(h);
}

function timeSlots(time) {
    var slots = [];
    var limits = time.split('-');
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
    l.forEach( slot => { r.push(rowTemplate([slot,'','','','',''])); } );
    return r;
}

function rowTemplate(l) {
    var r = [];
    l.forEach(item => { r.push(jQuery('<td/>').html(item)); } );
    return jQuery('<tr class="slot"/>').append(r);
}


function buildHour2Row(div) {
    var d = {};
    div.find('tr.slot td:first-child').each( (i,v) => { d[v.innerText] = 1+i; });
    return d;
}

function displayTitle(id, div) {
    gapi.client.calendar.calendars.get({
        'calendarId': id + '@group.calendar.google.com'
    }).then(response => { div.html(response.result.summary); });
    return div;
}

function displayEvent(div, event, hour2row) {
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
