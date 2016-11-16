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
    //to: 'fYXO1cGkseI:APA91bEgligA3KDmH0MdQ25mLeAPLuRQKk41FsTpcL9yg-Xvox5_2PemoTk3K2048u0oeDnd6aNsgVoG8nxTc9Fa9TDJGzuv3RoIxXjoZ7gLlpSpVNIASl9NBczx0MmSjjgPYmEWWgVR', // required fill with device token or topics
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
	//callback style
	fcm.send(lunch_message, function(err, response){
	    if (err) {
	        console.log("Something has gone wrong!");
	    } else {
	        console.log("Successfully sent with response: ", response);
	    }
	});
}).start();

cron.schedule('30 20 * * *', function () {
	//callback style
	fcm.send(dinner_message, function(err, response){
	    if (err) {
	        console.log("Something has gone wrong!");
	    } else {
	        console.log("Successfully sent with response: ", response);
	    }
	});
}).start();