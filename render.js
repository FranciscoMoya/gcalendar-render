var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
var MILLISECONDS_IN_A_WEEK = 432000000;

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
    jQuery('.person-calendar').each( (i, e) => {
        var div = jQuery(e);
        var instructor = div.attr('instructor');
        var ids = div.attr('calids').split(' ');
        var dates = parseDates(div.attr('dates'));
        div.empty().append(calendarPeriodSelector(renderPersonCalendarPeriods(instructor, ids, dates)));
    });
    
    jQuery('.calendar').each( (i, e) => {
        var div = jQuery(e);
        var ids = div.attr('calids').split(' ');
        var dates = parseDates(div.attr('dates'));
        div.empty().append(calendarPeriodSelector(renderAllCalendarPeriods(ids, dates)));
    });
}

function parseDates(s) {
    var dates = {};
    s.split(',').forEach(x => {
        var xx = x.split('|');
        dates[xx[0]] = xx[1];
    });
    return dates;
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

function renderPersonCalendarPeriods(instructor, ids, dates) {
    var all = [];
    for (var period in dates) {
        var obj = renderPersonCalendar(instructor, ids, dates[period]);
        obj.title = period;
        all.push(obj);
    }
    return all;
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

function renderPersonCalendar(instructor, ids, datestr) {
    var datetime = datestr.split(' ');
    var date = datetime[0];
    var time = datetime[1];
    var div = personCalendarTemplate(instructor, time);
    ids.forEach( id => {
        gapi.client.calendar.calendars.get({
            'calendarId': id + '@group.calendar.google.com'
        }).then(response => {
            var course = response.result.summary
            renderEvents(id, date, time, displayPersonEvent(instructor, course, div, date));
        });
    });
    return div;
}

function renderAllCalendars(ids, date) {
    var all = [];
    ids.forEach( id => { all.push(renderCalendar(id, date)); });
    return all;
}

function renderCalendar(id, datestr) {
    var datetime = datestr.split(' ');
    var date = datetime[0];
    var time = datetime[1];
    var div = calendarTemplate(id, time);
    renderEvents(id, date, time, displayCalendarEvent(div, date));
    return div;
}

function displayCalendarEvent(div, date) {
    var hour2row = buildHour2Row(div);

    return event => {
        var start = event.start.dateTime.substr(11,5);
        var end = event.end.dateTime.substr(11,5);
        var day = parseInt(event.start.dateTime.substr(8,2)) - parseInt(date.substr(8,2)) + 1;
        var hour = hour2row[start];
        var span = parseInt(end.substr(0,2)) - parseInt(start.substr(0,2));

        if (hour === undefined) return;
    
        div.find('table tr:eq('+ hour.toString() +') td:eq(' + day.toString() + ')')
            .attr('rowspan', span.toString()).attr('class', 'event')
            .append(jQuery('<div/>').attr('class','subject').html(event.summary))
            .append(jQuery('<div/>').attr('class','room').html(event.location))
            .append(jQuery('<div/>').attr('class','instructor').html(event.description.replace(/\n/g,'<br/>')))
            .show();

        for (var i=1; i<span; ++i)
            div.find('table tr:eq('+ (hour+i).toString() +') td:eq(' + day.toString() + ')').hide();
    }
}

function displayPersonEvent(instructor, course, div, date) {
    var hour2row = buildHour2Row(div);

    return event => {
        var start = event.start.dateTime.substr(11,5);
        var end = event.end.dateTime.substr(11,5);
        var day = parseInt(event.start.dateTime.substr(8,2)) - parseInt(date.substr(8,2)) + 1;
        var hour = hour2row[start];
        var span = parseInt(end.substr(0,2)) - parseInt(start.substr(0,2));

        if (hour === undefined || !findInstructor(event.description.split('\n'), instructor)) return;
    
        var box = null;
        for (var i = hour; i >= 0; --i) {
            box = div.find('table tr:eq('+ i.toString() +') td:eq(' + day.toString() + ')')
            if (box.is(':visible')) break;
        }
        box.attr('class', 'event');
            .append(jQuery('<div/>').attr('class','subject').html(event.summary))
            .append(jQuery('<div/>').attr('class','room').html(event.location))
            .append(jQuery('<div/>').attr('class','course').html(course))
            .show();
        box.attr('rowspan', Math.max(span, parseInt(box.attr('rowspan'))).toString());
    }
}

function findInstructor(all, instructor) {
    return all.indexOf(instructor) != -1;
}

function renderEvents(id, date, time, displayEvent) {
    var start = new Date(date);
    var end = new Date();
    end.setTime(start.getTime() + MILLISECONDS_IN_A_WEEK);
    gapi.client.calendar.events.list({
        'calendarId': id + '@group.calendar.google.com',
        'timeMin': start.toISOString(),
        'timeMax': end.toISOString(),
        'showDeleted': false,
        'orderBy': 'startTime',
        'singleEvents': true
    }).then(response => {
        var events = response.result.items;
        events.forEach(ev => { displayEvent(ev); });
    });
}

function personCalendarTemplate(instructor, time) {
    return jQuery('<div/>')
        .append(jQuery('<h2/>').html(instructor))
        .append(weekTemplate(time));
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

