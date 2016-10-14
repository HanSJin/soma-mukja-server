
const message = require('../message');
var mongo = require('mongodb');
const crypto = require('crypto');

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
        db.collection('user', {safe:true}, function(err, collection) {
            if (err) {
                console.log("The 'user' collection doesn't exist.");
            }
        });
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
<<<<<<< HEAD
  	if (!req.body.social_id || 
	  	!req.body.social_type || 
=======
	/*
  	if (!req.body.social_id || 
>>>>>>> 4bcec1a9dbe5de39784ab5c93bf503174b2631ad
	  	!req.body.device_type || 
	  	!req.body.app_version || 
	  	!req.body.nickname || 
	  	!req.body.about_me || 
	  	!req.body.age || 
	  	!req.body.gender || 
	  	!req.body.job || 
<<<<<<< HEAD
	  	!req.body.location)
    	return res.status(message.code(3)).json(message.json(3));   
    
    db.collection('user', function(err, collection) {
	    collection.findOne( { social_id : req.body.social_id }, function(err, user) {
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
=======
	  	!req.body.location){
		  	console.log("parameters are not enough");
		  	//console.log(req);
		  	
		  	//console.log(req.body);
		  	
		  	
		  	console.log(req.body.social_id);
		  	console.log(req.body.device_type);
		  	console.log(req.body.app_version);
		  	console.log(req.body.nickname);
		  	console.log(req.body.about_me);
		  	console.log(req.body.age);
		  	console.log(req.body.gender);
		  	console.log(req.body.job);
		  	console.log(req.body.location);
		  	
		  //return res.status(message.code(3)).json(message.json(3));   
	  	}
    	*/
    
    db.collection('user', function(err, collection) {
	    collection.findOne( { social_id : req.body.social_id }, function(err, user) {
		    if(err){
			    console.log(err);
		    }
// 		    if (!err) res.status(message.code(2)).json(message.json(2));
		    //console.log(user);
		    //return res(user);   
			if (user == null) {
				collection.insert( { 
					social_id : req.body.social_id,
					update_date : req.body.update_date,
					create_date : req.body.create_date,
					social_type : req.body.social_type,
					session_key : req.body.session_key,
					session_expire_date : req.body.session_expire_date,
					push_token : req.body.push_token,
					push_use : req.body.push_use,
					device_type : req.body.device_type,
					app_version : req.body.app_version,
					access_ip : req.body.access_ip,
					access_last_date : req.body.access_last_date,
					login_last_date : req.body.login_last_date,
					access_cnt : req.body.access_cnt,
					login_cnt : req.body.login_cnt,
					report_cnt : req.body.report_cnt,
					thumbnail_url : req.body.thumbnail_url,
					thumbnail_url_small : req.body.thumbnail_url_small,
>>>>>>> 4bcec1a9dbe5de39784ab5c93bf503174b2631ad
					nickname : req.body.nickname,
					about_me : req.body.about_me,
					age : req.body.age,
					gender : req.body.gender, 
					job : req.body.job,
					location : req.body.location
				}, function(err, user) {
<<<<<<< HEAD
				    if (!user) res.status(message.code(1)).json(message.json(1));
					return res.status(message.code(0)).json(user.ops);
				});
			} else {
				return res.status(message.code(2)).json(message.json(2)); 
			}
        });
    });
};


=======
					if(!err){
						res.status(message.code(2)).json(message.json(2));    //유저 데이터 생성 성공! 코드 몇번?
					}
				    //res(1);//code(1) = success;
				    res.send(user)
				});
				
			}else{
				res.send(user);
				//res.status(message.code(2)).json(message.json(2));    //유저 데이터가 이미 존재!
			}
        });
    });
    
};


exports.updateAboutme = function (req, res){
	db.collection('user', function(err, collection) {
	    collection.update( { social_id : req.params.user_id }, 
	    {$set:{about_me:req.body.about_me}}, 
	    function(err, user) {
			if(err){
				console.log(err);
			}
			res.status(message.code(0)).json(message.json(0));
	})});
};
>>>>>>> 4bcec1a9dbe5de39784ab5c93bf503174b2631ad










