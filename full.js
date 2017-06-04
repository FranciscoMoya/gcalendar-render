function displayPeriodCalendars(div, calendars) {
    var cals = [];
    Object.keys(calendars.periods).forEach(period => {
        var cal = $('<div/>').appendTo(div);
        cal.title = period;
        displayPeriodCalendar(cal, calendars.ids, calendars.periods[period]);
        cals.push(cal);
    });
    div.prepend(selectorWidget(cals));
}

function displayPeriodCalendar(div, ids, options) {
    var cals = [];
    Object.keys(ids).forEach(id => {
        var cal = $('<div/>').attr('id',ids[id].split('@')).appendTo(div);
        displayCalendar(cal, ids, id.split(','), options);
        cal.title = id;
        cals.push(cal);
    });
    return cals;
}


function displayCalendars(div, ids) {
    var options = {
        defaultDate: '2017-09-11',
        allDaySlot: true,
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'agendaDay,agendaWeek,month'
        },
        columnFormat: 'ddd M/D',
        minTime: '08:00',
        maxTime: '21:00',
        navLinks: true
    };
    var cals = displayPeriodCalendar(div, ids, options);
    div.prepend(selectorWidget(cals));
}

function displayCalendar(div, ids, sources, options) {
    var settings = {
        header: false,
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
    if (options)
        for (var i in options)
            settings[i] = options[i];
    div.fullCalendar(settings).prepend($('<h1/>').html(sources.join(',')));
}

function getEvSources(ids, sources) {
    var src = [];
    sources.forEach( (id, i) => {
        src.push({
            googleCalendarId: ids[id],
            className: 'ev-src-' + i 
        });
    });
    return src;
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
