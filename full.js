function displayCalendars(div, ids) {
    var cals = [];
    Object.keys(ids).forEach(id => {
        var cal = $('<div/>').attr('id',ids[id].split('@')).appendTo(div);
        displayCalendar(cal, ids, id.split(','));
        cal.title = id;
        cals.push(cal);
    });
    div.prepend(selectorWidget(cals));
}

function displayCalendar(div, ids, sources) {
    div.fullCalendar({
        header: {
            left: 'title',
            center: 'prev,next today',
            right: 'agendaDay,agendaWeek,month'
        },
        defaultDate: '2017-09-11',
        defaultView: 'agendaWeek',
        slotLabelFormat: 'HH:mm',
        locale: 'es',
        minTime: '08:00',
        maxTime: '21:00',
        navLinks: true,
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
    }).prepend($('<h1/>').html(sources.join(',')));
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
