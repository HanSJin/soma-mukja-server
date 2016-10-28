
const message = require('../message');
var mongo = require('mongodb');
const crypto = require('crypto');
var ObjectId = require('mongodb').ObjectID;

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
			
			var now = new Date();
			now.setHours(now.getHours()+9);
			var new_access_cnt = user.access_cnt+1;
			var new_login_cnt = user.login_cnt+1;
			
			db.collection('user').update(
				{ social_id: req.body.social_id},
				{ $set: {access_last_date:now, login_last_date:now, 
						access_cnt:new_access_cnt,login_cnt:new_login_cnt,friends:req.body.friends}}
			)
            res.send(user);
        });
    });
};

exports.signIn_NonFacebook = function(req, res) {
  	if (!req.body.social_id || !req.body.password)
    	return res.status(message.code(3)).json(message.json(3));   
    	
    db.collection('user', function(err, collection) {
	    var main = new Array();
		main[0] = { social_id :req.body.social_id };
		main[1] = { password : req.body.password };

	    collection.find( {$and: main}).toArray(function(err, user) {
		    var len = user.length;
			if (len == 0) {
				return res.status(message.code(5)).json(message.json(5, err));
			}
			
			var now = new Date();
			now.setHours(now.getHours()+9);
			var new_access_cnt = user[0].access_cnt+1;
			var new_login_cnt = user[0].login_cnt+1;
		
			new_access_cnt = user[0].access_cnt+1;
			new_login_cnt = user[0].login_cnt+1;
			db.collection('user').update(
					{ _id: ObjectId(user[0]._id)},
					{ $set: {access_last_date:now, login_last_date:now, 
							access_cnt:new_access_cnt,login_cnt:new_login_cnt}}
			)

            res.send(user[0]);
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
				now.setHours(now.getHours()+9);
				
				var ip;
				require('dns').lookup(require('os').hostname(), function (err, add, fam) {
				 ip = add;
				});
				
				collection.insert({ 
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
					access_ip : ip,
					access_last_date : now,
					login_last_date : now,
					access_cnt : 0,
					login_cnt : 0,
					report_cnt : 0,
					thumbnail_url : "http://graph.facebook.com/"+req.body.social_id+"/picture?type=normal",
					thumbnail_url_small : "http://graph.facebook.com/"+req.body.social_id+"/picture?type=small",
					nickname : req.body.nickname,
					about_me : req.body.about_me,
					age : req.body.age,
					gender : req.body.gender, 
					job : req.body.job,
					location : req.body.location,
					rated_food_num : 0,
					password: req.body.password,
					friends: req.body.friends
				}, function(err, user) {
						if(!err){
							//res.status(message.code(2)).json(message.json(2));    //유저 데이터 생성 성공! 코드 몇번?
							collection.findOne( {social_id:req.body.social_id},function(err,user){
							
								res.send(user);
							});
						}
						  //res(1);//code(1) = success;
					}
				);
			} else {
				res.status(message.code(1)).json(message.json(1));
			}
        });
    });
};

exports.updateAboutme = function(req, res){
	var now = new Date();
	now.setHours(now.getHours() + 9);  
	
	db.collection('user', function(err, collection) {
	    collection.update( { _id : ObjectId(req.params.user_id) }, 
	    {$set:{about_me:req.body.about_me, update_date:now}}, 
	    function(err, user) {
			if(err){
				console.log(err);
			}
			res.status(message.code(0)).json(message.json(0));
		})
	});
};

exports.updateUserImage_Facebook = function(req, res){
	var now = new Date();
	now.setHours(now.getHours() + 9);  
	
	db.collection('user', function(err, collection) {
	    collection.update( { _id : ObjectId(req.params.user_id) }, 
	    {$set:{thumbnail_url:req.body.thumbnail_url, thumbnail_url_small:req.body.thumbnail_url_small,update_date:now}}, 
	    function(err, user) {
			if(err){
				console.log(err);
			}
			res.status(message.code(0)).json(message.json(0));
		})
	});
};


exports.userImageUpload = function(req, res){
	
	if (!req.params.user_id) return res.status(message.code(3)).json(message.json(3));

	db.collection('user').update( 
		{ _id: ObjectId(req.params.user_id) }, 
		{ $set: {thumbnail_url : req.file.filename} },
		function(err, update) {
			db.collection('user').findOne( { _id : ObjectId(req.params.user_id) }, function(err,update_user){
				if (err) res.status(message.code(1)).json(message.json(1));
				if (!update_user) res.status(message.code(1)).json(message.json(1));
				console.log(update_user);
				return res.status(message.code(0)).json(update_user);
			});
		}
	);			
};

exports.myInfo = function(req, res) {
	if (!req.params.uid)
		return res.status(message.code(3)).json(message.json(3));
	
    db.collection('user').findOne( 
	    { _id : ObjectId(req.params.uid)},
	    function(err, user){
			res.send(user);    
		}
    );
};

exports.withdrawalUser = function(req, res) {
  	if (!req.body.user_id)
    	return res.status(message.code(3)).json(message.json(3));   
    //user 콜렉션에서 제거	
    db.collection('user', function(err, collection) {
	    collection.findOne( { _id : ObjectId(req.body.user_id) }, function(err, user) {
			if (!user) return res.status(message.code(5)).json(message.json(5, err));
						
			db.collection('user').deleteOne(
				{ _id: ObjectId(req.body.user_id)}
			)
			return res.status(message.code(0))
        });
    });
    
    //food 콜렉션에서 like, rate 했던 기록 제거(like_cnt--, rate_cnt--)
    
    //user 콜렉션에서 다른 유저의 친구였다면, 친구목록에서 제거
};
