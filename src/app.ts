import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as path from 'path';
import * as favicon from 'serve-favicon';

import { router as routes } from './routes/index';
import { router as users } from './routes/users';

const app = express();

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(favicon(path.join(__dirname, '../public/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/css', express.static(path.join(__dirname, '../node_modules/reveal.js/css')));
app.use('/js', express.static(path.join(__dirname, '../node_modules/reveal.js/js')));
app.use('/lib', express.static(path.join(__dirname, '../node_modules/reveal.js/lib')));
app.use('/plugin', express.static(path.join(__dirname, '../node_modules/reveal.js/plugin')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  const err = new Error('Not Found');
  (err as any).status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
    return;
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
  return;
});

module.exports = app;
