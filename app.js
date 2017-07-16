var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  fs.readFile('./index.html', (err, html) => res.end(html));
});
app.get('/movies/:movieName', (req, res) => {
  const { movieName } = req.params;
  const movieFile = `./movies/${movieName}`;
  fs.stat(movieFile, (err, stats) => {
    if (err) {
      console.log(err);
      return res.status(404).end('<h1>Movie Not found</h1>');
    }
// Variáveis necessárias para montar o chunk header corretamente
    const { range } = req.headers;
    const { size } = stats;
    const start = Number((range || '').replace(/bytes=/, '').split('-')[0]);
    const end = size - 1;
    const chunkSize = (end - start) + 1;
    // Definindo headers de chunk
    res.set({
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4'
    });
   // É importante usar status 206 - Partial Content para o streaming funcionar
    res.status(206);
    // Utilizando ReadStream do Node.js
    // Ele vai ler um arquivo e enviá-lo em partes via stream.pipe()
    const stream = fs.createReadStream(movieFile, { start, end });
    stream.on('open', () => stream.pipe(res));
    stream.on('error', (streamErr) => res.end(streamErr));
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
