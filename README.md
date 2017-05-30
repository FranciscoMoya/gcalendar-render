# Custom rendering of Google Calendars

Pequeña demostración de uso del API de Google Calendar para renderizar
calendarios como los usados en la Universidad de Castilla-La Mancha,
Escuela de Ingeniería Industrial de Toledo.

## Modo de uso

Se necesita un Google client id válido para ejecutar correctamente la
aplicación y no puedo distribuir ninguno en GitHub.  Así que no te
queda más remedio que crearlo tú mismo.

* Visita la
  [consola de Google](https://console.developers.google.com), pestaña
  *Credentials*, añade un nuevo Id de cliente de Oauth.

* Edita un archivo de nombre `cred.js` y escribe:

``` javascript
var CLIENT_ID = 'Pon aquí tu propio Id de cliente';
```

* Abre una consola (e.g. ejecuta Powershell) y sirve las páginas, por ejemplo con [python](http://python.org):

```
python -m http.server
```

* Si has seguido el paso anterior tendrás la aplicación en las siguientes URL:

  [Demostración de calendario de semestre](http://rawgit.com/FranciscoMoya/gcalendar-render/master/demo.html)
  
  [Demostración de calendario de personas](http://rawgit.com/FranciscoMoya/gcalendar-render/master/person.html)
