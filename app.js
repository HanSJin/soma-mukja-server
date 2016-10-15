const uri = require('./dbURI.json');
const imageRepoPath = './public/images';

const express = require('express');
const path = require('path');
const app = express();


const foods = require('./routes/foods');
// const users = require('./routes/users');
const bodyParser  = require('body-parser');
const user = require('./routes/user');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const message = require('./message');


const mongoose = require('mongoose');
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    console.log("Connected to mongod server");
});
db = mongoose.createConnection(uri);



app.use(express.static(path.join(__dirname, 'public')));  // 저장한 이미지를 배포하기 위함
app.use(logger('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/// TEST API 여깃는건 샘플이었지?
/*
app.get('/foods', foods.findAll);
app.get('/foods/:_id/:user', foods.findById);
app.put('/foods/:_id', foods.updateFood);
app.delete('/foods/:_id', foods.deleteFood);
// app.post('/users', users.addUser);
app.get('/pio/create_items',foods.addAllitem);
app.get('/pio/buy/:user/:food',foods.buyitem);
app.get('/pio/similar/:food',foods.similarResult);
app.get('/pio/recommendation/:user',foods.recommendationResult);
*/



// REAL API -- !!
app.post('/sign/in', user.signIn);
app.post('/sign/up', user.signUp);

//  SJ

// 탭 1 추천 받기
app.post('/recommand/:uid', foods.getRecommand);

// 탭 1 추천 받기
app.get('/category', foods.getCategory);

// 탭 2 피드 받기
app.get('/feeds/:uid/:page', foods.getFeeds);

// 탭 2 부적절 컨텐츠
app.get('/report/:uid/:food_id', foods.report);

// 탭 2 음식 업로드
app.post('/food', foods.addFood);

// 탭 2 음식 업로드 (이미지)
app.post('/upload/:image_url', foods.uploadImage);



app.get('/foods/:keyword', foods.getSearchResult);
app.post('/users/:user_id/edit/aboutMe', user.updateAboutme);
app.get('/images/food/:filename', foods.getImage);
app.get('/:uid/foods', foods.getFoodsForUser);



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

app.listen(8887);
