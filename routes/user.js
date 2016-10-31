
const message = require('../message');
var mongo = require('mongodb');
var predictionio = require('predictionio-driver');
const crypto = require('crypto');
var ObjectId = require('mongodb').ObjectID;

// predicitonio
var eventsUrl= process.env.PIOEventUrl || 'http://52.192.137.69';
var eventsPort= process.env.PIOEventPort || '7070';
var queryUrl= process.env.PIOQueryUrl || 'https://52.192.137.69';
var queryPort =  process.env.PIOQueryPort ||'8000';
var appID= parseInt(process.env.PIOAppID || 26);
var accessKey=process.env.PIOAccessKey || 'Wl_qIIHjGfIgDX1L84jqXHQ3ZFLVxb4ejV3Fz6GX4vRzEf7noPO1DxDFfFJJB8mJ';

var client = new predictionio.Events({
                        url:eventsUrl,
                        appId:appID,
                        accessKey:accessKey,
                        strictSSL:false
                });
var pio = new predictionio.Engine({
                        url: queryUrl,
                        strictSSL:false
                });
                
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
    
    if(req.body.friends){
	   var friends = req.body.friends;
	   
	   db.collection('user',function(err,collection){
		   var main = new Array();
		   for(var idx=0;idx<friends.length;idx++){
		   		main[idx] = {social_id:friends[idx].user_id}
		   }
		   
		   
	  	collection.find(
		  	 {$or:main}
		  	 ).toArray(function(err, user){
			  	 if(!user){
				  	 friends = [];
			  	 }else{
				  	 console.log(user.length);
				  	 var len = user.length;
				  	 for(var idx=0;idx<len;idx++){
					 	friends[idx].user_id = ObjectId(user[idx]._id); //social_id -> ObjectId로 바꾸는 과정
					 	friends[idx].user_name = user[idx].nickname; 	 
					 }
				 }
		  	 });
	  	}); 
    }
    
    db.collection('user', function(err, collection) {
	    collection.findOne( { social_id : req.body.social_id }, function(err, user) {
			if (!user) return res.status(message.code(5)).json(message.json(5, err));
			
			var now = new Date();
			now.setHours(now.getHours());
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
			now.setHours(now.getHours());
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
				now.setHours(now.getHours());
				
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
								
					            client.createUser({uid: user._id}, function (err,result_pio) {
					                if (!err) console.log('predictionIO createUser :'+JSON.stringify(result_pio));
					            });
					            
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
    
    //<food 콜렉션>
    //like, rate, registerFood 했던 기록 제거
    //(like_cnt--, rate_cnt--, like_person에서 제거, rate_person에서 제거)
    //rate_distribution은 어떻게 제거?
    //author였으면, 탈퇴 유저가 올렸던 음식들 다 제거.
    
    
    //<user 콜렉션>
    //다른 유저의 친구였다면, 친구목록(friends)에서 제거
    
};
