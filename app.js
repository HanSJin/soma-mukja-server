const uri = require('./dbURI.json');
const imageRepoPath = './public/images';

const express = require('express');
const path = require('path');
const app = express();

const multer = require('multer');
const uploader = multer({ dest: imageRepoPath });

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


// REAL API -- !!
app.post('/sign/in', user.signIn);
app.post('/sign/in/NonFacebook', user.signIn_NonFacebook);
app.post('/sign/up', user.signUp);


//  SJ

// 탭 1 추천 받기
app.post('/recommand/:uid', foods.getRecommand);

// 탭 1 추천 받기
app.get('/category', foods.getCategory);

// 음식 - 음식 정보 받기
app.get('/food/:food_id', foods.getFood);

// 음식 - 상세보기
app.get('/food/:food_id/:uid/view', foods.viewFood);

// 음식 - 먹고싶어요
app.post('/like/:uid/:food_id', foods.like);

// 음식 - 평가하기
app.post('/rate/:uid/:food_id', foods.rate);

// 음식 - 해당 음식을 먹고싶어한 사람들
app.get('/like/:food_id', foods.likePersons);

// 탭 3 검색 디폴트 목록 받기
app.get('/explore', foods.getExplore);

// 탭 2 피드 받기
app.get('/feeds/:uid/:page', foods.getFeeds);

// 탭 2 부적절 컨텐츠
app.get('/report/:uid/:food_id', foods.report);


// 탭 2 음식 업로드
app.post('/food/post', foods.addFood);

// 탭 2 음식 업로드 (이미지)
app.post(
  '/post/:food_id/image/upload',
  uploader.single('post_image'),
  foods.foodImageUpload
); 

// 평가하기 - 평가 음식 리스트
app.get('/rank/:uid/:page', foods.rankList);
/*

// 평가하기 - 음식 평가하기
app.post('/rank/:uid/:food_id/:rate', foods.rankPost);
*/

// 탭 5 내가 좋아한 음식
app.get('/users/:uid/mylist', foods.myFoodList);


app.get('/foods/:keyword', foods.getSearchResult);
app.post('/users/:user_id/edit/aboutMe', user.updateAboutme);
app.get('/images/food/:filename', foods.getImage);
app.get('/:uid/foods', foods.getFoodsForUser);

// 탭 5 유저 업로드 (이미지)
app.post(
  '/post/:user_id/image/upload/profile',
  uploader.single('post_image'),
  user.userImageUpload
); 

// 탭 5 유저 업로드 (페이스북 이미지)
app.post('/users/:user_id/edit/profile/facebook', user.updateUserImage_Facebook);

// 탭 5 유저 정보 새로고침
app.get('/users/:uid/myinfo', user.myInfo);


app.post('/user/withdrawal', user.withdrawalUser);

// 탭 2 친구 요청 가져오기 //너가 친구 요청 //friends_NonFacebook_Waiting
app.get('/requests/waiting/:uid/:page', user.getRequests);

// 탭 2 친구 요청 가져오기 2 //내가 친구 요청 //friends_NonFacebook_Requested
app.get('/requests/requested/:uid/:page', user.getRequests2);

// 탭 2 친구 요청 가져오기 3 //우린 이미 친구 //friends_NonFacebook
app.get('/requests/friends/:uid/:page', user.getRequests3);

// 유저 - 친구 요청 처리하기(accept)
app.post('/friends/accept/:me_id/:you_id', user.acceptYou);

// 유저 - 친구 요청 처리하기(reject)
app.post('/friends/reject/:me_id/:you_id', user.rejectYou);









 
// 개인정보 취급방침
app.get('/privacy_rule', function (req, res) { 
	fs.readFile('public/privacy_rule.html', function (error, data) {
		if (error) {
			console.log(error);
		} else {
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(data);
		} 
	});
});

// 이용약관
app.get('/agreement', function (req, res) { 
	fs.readFile('public/agreement.html', function (error, data) {
		if (error) {
			console.log(error);
		} else {
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(data);
		} 
	});
});



// PIO
// test
app.get('/food/:food_id/buy/:uid', foods.foodBuy);
app.get('/food/:food_id/view/:uid', foods.foodViewTest);
app.get('/food/recommand/:uid', foods.foodRecommandTest);

app.get('/food/:uid/recommand', foods.recommandFoodResult);

app.post('/food/comment/:food_id', foods.commentFood);

app.get('/food/comment/get/:food_id', foods.getCommentFood);

app.get('/food/comment/get/:food_id/:comment_id', foods.getOneCommentFood);

app.post('/food/comment/:food_id/:comment_id', foods.oneCommentFood);

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


/*
	fcm push - cron
*/
var FCM = require('fcm-push');

var serverKey = 'AIzaSyDVzXolGCvttuz0V0z0dc3xqrY6fMJ3GUc'; 
var fcm = new FCM(serverKey);

var lunch_message = {
    //to: 'fYXO1cGkseI:APA91bEgligA3KDmH0MdQ25mLeAPLuRQKk41FsTpcL9yg-Xvox5_2PemoTk3K2048u0oeDnd6aNsgVoG8nxTc9Fa9TDJGzuv3RoIxXjoZ7gLlpSpVNIASl9NBczx0MmSjjgPYmEWWgVR', // required fill with device token or topics
    to: '/topics/push_on',
    collapse_key: 'your_collapse_key', 
    data: {
        data : 'data'
    },
    notification: {
        title: '오늘 점심은 뭐 먹지?',
        body: '맞춤 점심 추천 메뉴 10가지, 확인해보세요!'
    }
};

var dinner_message = {
    to: '/topics/push_on',
    collapse_key: 'your_collapse_key', 
    data: {
        data : 'data'
    },
    notification: {
        title: '오늘 저녁은 뭐 먹지?',
        body: '맞춤 저녁 추천 메뉴 10가지, 확인해보세요!'
    }
};


var cron = require('node-cron');

cron.schedule('30 2 * * *', function () {
	//한국시간으로 11시 30분
	fcm.send(lunch_message, function(err, response){
	    if (err) {
	        console.log("Something has gone wrong!");
	    } else {
	        console.log("Successfully sent with response: ", response);
	    }
	});
}).start();

cron.schedule('30 20 * * *', function () {
	//한국시간으로 5시 30분
	fcm.send(dinner_message, function(err, response){
	    if (err) {
	        console.log("Something has gone wrong!");
	    } else {
	        console.log("Successfully sent with response: ", response);
	    }
	});
}).start();