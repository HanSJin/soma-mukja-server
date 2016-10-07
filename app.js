const express = require('express');
const foods = require('./routes/foods');
const users = require('./routes/users');

var app = express();
	app.configure(function () {
	app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
	app.use(express.bodyParser());
});


app.get('/foods', foods.findAll);
app.get('/foods/:_id/:user', foods.findById);
app.post('/foods', foods.addFood);
app.put('/foods/:_id', foods.updateFood);
app.delete('/foods/:_id', foods.deleteFood);
app.post('/users', users.addUser);
app.get('/pio/create_items',foods.addAllitem);
app.get('/pio/buy/:user/:food',foods.buyitem);
app.get('/pio/similar/:food',foods.similarResult);
app.get('/pio/recommendation/:user',foods.recommendationResult);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      status: err.status,
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;

app.listen(8888);