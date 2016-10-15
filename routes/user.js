
const message = require('../message');
var mongo = require('mongodb');
const crypto = require('crypto');
//require('date-utils');



var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    
 
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('mukja', server);

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'user' database");
    }
});

exports.signIn = function(req, res) {
  	if (!req.body.social_id)
    	return res.status(message.code(3)).json(message.json(3));   
    db.collection('user', function(err, collection) {
	    collection.findOne( { social_id : req.body.social_id }, function(err, user) {
			if (!user) return res.status(message.code(5)).json(message.json(5, err));
            res.send(user);
        });
    });
};

exports.signUp = function(req, res) {
    db.collection('user', function(err, collection) {
	    collection.findOne( { social_id : req.body.social_id }, function(err, user) {
		    if(err){
			    console.log(err);
		    } 
			if (user == null) {
				var now = new Date();
				collection.insert( { 
					social_id : req.body.social_id,
					update_date : now,
					create_date : now,
					social_type : req.body.social_type,
					session_key : "",
					session_expire_date : "",
					push_token : req.body.push_token,
					push_use : true,
					device_type : req.body.device_type,
					app_version : req.body.app_version,
					access_ip : "",
					access_last_date : now,
					login_last_date : now,
					access_cnt : 0,
					login_cnt : 0,
					report_cnt : 0,
					thumbnail_url : "",
					thumbnail_url_small : "",
					nickname : req.body.nickname,
					about_me : req.body.about_me,
					age : req.body.age,
					gender : req.body.gender, 
					job : req.body.job,
					location : req.body.location
				}, function(err, user) {
					if(!err){
						res.status(message.code(2)).json(message.json(2));    //유저 데이터 생성 성공! 코드 몇번?
					}
				   //res(1);//code(1) = success;
				   res.send(user)
				});
			} else {
				res.send(user);
			}
        });
    });
						    
};

exports.updateAboutme = function (req, res){
	var dt = new Date();
	dt.setHours(dt.getHours() + 9);  
	var d = dt.toFormat('YYYY-MM-DD HH24:MI:SS');
		
	db.collection('user', function(err, collection) {
	    collection.update( { social_id : req.params.user_id }, 
	    {$set:{about_me:req.body.about_me, update_date:d}}, 
	    function(err, user) {
			if(err){
				console.log(err);
			}
			res.status(message.code(0)).json(message.json(0));
		})
	});
};






