function displayAllSubjectsCalendars(div, calendars, subjects) {
    var cals = [];
    subjects.forEach(function (name) {
        var cal = $('<div/>').appendTo(div);
        cal.title = name;
        displaySubjectCalendar(cal, calendars, name);
        cals.push(cal);
    });
    div.prepend(selectorWidget(cals));
}

function displaySubjectCalendar(div, calendars, name) {
    var options = {
        eventRender: function (event, element) {
            if (!findName(event.title.split('Lab. '), name))
                return false;
            element.append($('<div class="fc-course"/>').html(event.source.displayName))
                .append($('<div class="fc-location"/>').html(event.location));
        }
    };
    var cals = [];
    Object.keys(calendars.periods).forEach(function (period) {
        var cal = $('<div/>').appendTo(div);
        cal.title = period;
        displayCalendar(cal, calendars.ids, Object.keys(calendars.ids),
                        mergeOptions(calendars.periods[period], options));
        cals.push(cal);
    });
}

function displayAllInstructorsCalendars(div, calendars, instructors) {
    var cals = [];
    instructors.forEach(function (name) {
        var cal = $('<div/>').appendTo(div);
        cal.title = name;
        displayInstructorCalendar(cal, calendars, name);
        cals.push(cal);
    });
    div.prepend(selectorWidget(cals));
}

function displayInstructorCalendar(div, calendars, name) {
    var options = {
        eventRender: function (event, element) {
            if (!findName(event.description.split('\n'), name))
                return false;
            element.append($('<div class="fc-course"/>').html(event.source.displayName))
                .append($('<div class="fc-location"/>').html(event.location));
        }
    };
    var cals = [];
    Object.keys(calendars.periods).forEach(function (period) {
        var cal = $('<div/>').appendTo(div);
        cal.title = period;
        displayCalendar(cal, calendars.ids, Object.keys(calendars.ids),
                        mergeOptions(calendars.periods[period], options));
        cals.push(cal);
    });
}

function findName(all, name) {
    return all.indexOf(name) != -1;
}

function displayPeriodCalendars(div, calendars) {
    var cals = [];
    Object.keys(calendars.periods).forEach(function (period) {
        var cal = $('<div/>').appendTo(div);
        cal.title = period;
        displayPeriodCalendar(cal, calendars.ids, calendars.periods[period]);
        cals.push(cal);
    });
    div.prepend(selectorWidget(cals));
}

function displayPeriodCalendar(div, ids, options) {
    var cals = [];
    Object.keys(ids).forEach(function (id) {
        var cal = $('<div/>').attr('id',ids[id].split('@')).appendTo(div);
        displayCalendar(cal, ids, id.split(','), options);
        cal.title = id;
        cals.push(cal);
    });
    return cals;
}


function displayCalendars(div, ids) {
    var options = {
        defaultDate: '2018-09-10',
        allDaySlot: true,
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'agendaDay,agendaWeek,month'
        },
        columnFormat: 'ddd M/D',
        minTime: '08:00',
        maxTime: '21:00',
        navLinks: true,
        height: undefined
    };
    var cals = displayPeriodCalendar(div, ids, options);
    div.prepend(selectorWidget(cals));
}

function displayCalendar(div, ids, sources, options) {
    var settings = {
        header: false,
        height: 'auto',
        allDaySlot: false,
        columnFormat: 'ddd',
        defaultView: 'agendaWeek',
        slotLabelFormat: 'HH:mm',
        locale: 'es',
        editable: false,
        weekends: false,
        googleCalendarApiKey: location.search.substr(1),
        eventSources: getEvSources(ids, sources),
        currentTimezone: 'Europe/Madrid',
        eventClick: function(event) {
            window.open(event.url, 'gcalevent', 'width=700,height=600');
            return false;
        },
        eventRender: function (event, element) {
            element.append($('<div class="fc-instructor"/>').html(event.description.replace(/\n/g,'<br/>')))
                .append($('<div class="fc-location"/>').html(event.location));
        },
        loading: function(bool) {
            $('#loading').toggle(bool);
        }  
    };
    mergeOptions(settings, options);
    div.fullCalendar(settings).prepend($('<h1/>').html(div.title || sources.join(',')));
}

function mergeOptions(dest, orig) {
    if (orig)
        for (var i in orig)
            dest[i] = orig[i];
    return dest;
}

function getEvSources(ids, sources) {
    var src = [];
    sources.forEach( function (id, i) {
        src.push({
            googleCalendarId: ids[id],
            className: 'ev-src-' + i,
            displayName: id
        });
    });
    return src;
}

function selectorWidget(objs) {
    var sel = jQuery('<select/>');
    objs.forEach( function (o,i) { sel.append(jQuery('<option/>').attr('value', i).html(o.title)); });
    sel.change( function (_) { showOnly(objs, sel.val()); });
    showOnly(objs, 0);
    return sel;
}

function showOnly(objs, selection) {
    objs.forEach( function (o, i) {
        if (i != selection) o.hide();
        else o.show();
    });
}
