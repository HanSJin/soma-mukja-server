
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
var appID= parseInt(process.env.PIOAppID || 45);
var accessKey=process.env.PIOAccessKey || 'uQNzljan3dJndKZABquGkxejxbJWSLJWqREQC9ZvG89MtoAqc6JHGTLkASFLSYrj';

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

var db_user = db.collection('user');
var db_food = db.collection('food');

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
						 friends[idx].user_pic_small = user[idx].user_pic_small;

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
	var list = new Array();

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
					birthday : req.body.birthday,
					gender : req.body.gender, 
					job : req.body.job,
					location : req.body.location,
					rated_food_num : 0,
					password: req.body.password,
					friends: req.body.friends,
					friends_NonFacebook: list,
					friends_NonFacebook_Waiting: list,
					friends_NonFacebook_Rejected: list,
					friends_NonFacebook_Requested: list,
					choice_cnt:0,
					choice_last_date: now,
					location_point: req.body.location_point
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



//친구 요청 가져오기 //너가 친구 요청 //friends_NonFacebook_Waiting
exports.getRequests = function(req, res) {
	console.log("req.params.uid : " + req.params.uid);
	if (!req.params.uid || !req.params.page)
		return res.status(message.code(3)).json(message.json(3));

	var list = new Array();
	var list_user_id = new Array();


	db_user.findOne({_id:ObjectId(req.params.uid)}, function(err, me){
		//main = { _id : { $in : me.friends_NonFacebook_Waiting } };
		list = me.friends_NonFacebook_Waiting;

		if(list==null){
			return res.status(message.code(1)).json(message.json(1));
		}

		for(var i=0;i<list.length;i++)
			list_user_id[i]=list[i].user_id;

		console.log(list_user_id);
		db_user.find({_id : { $in : list_user_id}}).limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
			if(err) {console.log("err : " + err); return res.status(message.code(1)).json(err);}
			if(!newfeeds) {console.log("no user : " + newfeeds); return res.status(message.code(1)).json("no user");}
			//console.log("newfeeds : " + newfeeds);
			return res.status(message.code(0)).json(newfeeds);
		});
	});


	//waiting list 에서 10개 먼저 뽑기

};

//친구 요청 가져오기 2 //내가 친구 요청 //friends_NonFacebook_Requested
exports.getRequests2 = function(req, res) {
	console.log("req.params.uid : " + req.params.uid);
	if (!req.params.uid || !req.params.page)
		return res.status(message.code(3)).json(message.json(3));

	var list = new Array();
	var list_user_id = new Array();


	db_user.findOne({_id:ObjectId(req.params.uid)}, function(err, me){
		//main = { _id : { $in : me.friends_NonFacebook_Waiting } };
		list = me.friends_NonFacebook_Requested;

		if(list==null){
			return res.status(message.code(1)).json(message.json(1));
		}

		for(var i=0;i<list.length;i++)
			list_user_id[i]=list[i].user_id;

		console.log(list_user_id);
		db_user.find({_id : { $in : list_user_id}}).limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
			if(err) {console.log("err : " + err); return res.status(message.code(1)).json(err);}
			if(!newfeeds) {console.log("no user : " + newfeeds); return res.status(message.code(1)).json("no user");}
			//console.log("newfeeds : " + newfeeds);
			return res.status(message.code(0)).json(newfeeds);
		});
	});


	//waiting list 에서 10개 먼저 뽑기

};

//친구 요청 가져오기 3 //우린 이미 친구 //friends_NonFacebook
exports.getRequests3 = function(req, res) {
	console.log("req.params.uid : " + req.params.uid);
	if (!req.params.uid || !req.params.page)
		return res.status(message.code(3)).json(message.json(3));

	var list = new Array();
	var list_user_id = new Array();


	db_user.findOne({_id:ObjectId(req.params.uid)}, function(err, me){
		//main = { _id : { $in : me.friends_NonFacebook_Waiting } };
		list = me.friends_NonFacebook;

		if(list==null){
			return res.status(message.code(1)).json(message.json(1));
		}

		for(var i=0;i<list.length;i++)
			list_user_id[i]=list[i].user_id;

		console.log(list_user_id);
		db_user.find({_id : { $in : list_user_id}}).limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
			if(err) {console.log("err : " + err); return res.status(message.code(1)).json(err);}
			if(!newfeeds) {console.log("no user : " + newfeeds); return res.status(message.code(1)).json("no user");}
			//console.log("newfeeds : " + newfeeds);
			return res.status(message.code(0)).json(newfeeds);
		});
	});


	//waiting list 에서 10개 먼저 뽑기

};




exports.acceptYou = function(req, res) {
	if (!req.params.me_id || !req.params.you_id)
		return res.status(message.code(3)).json(message.json(3));

	db_user.findOne( { _id : ObjectId(req.params.me_id) }, function(err,me){
		if (err) {console.log("asd7"); return res.status(message.code(1)).json(message.json(1));}
		if (!me) {console.log("asd8"); return res.status(message.code(1)).json(message.json(1));}

		var now = new Date();

		db_user.findOne( { _id : ObjectId(req.params.you_id)}, function(err,you) {
			if (err) {console.log("asd5"); return res.status(message.code(1)).json(message.json(1));}
			if (!you) {console.log("asd6"); return res.status(message.code(1)).json(message.json(1));}


			//상대와 내가 이미 친구였는지 여부 확인
			var i2 = 0;
			var len2 = you.friends_NonFacebook.length;

			for (; i2 < len2; i2++) {
				if (you.friends_NonFacebook[i2].user_id.equals(me._id)){
					console.log("zzz");
					return res.status(message.code(0)).json(message.json(0));
				}
			}


			//상대가 나를 좋아하고있었는지 여부 확인
			var i = 0;
			var len = you.friends_NonFacebook_Requested.length;

			for (; i < len; i++) {
				if (you.friends_NonFacebook_Requested[i].user_id.equals(me._id))
					break;
			}


			if(i!=len){//상대가 나를 좋아하고있었을 경우
				//me db, friends_waiting에 you_id 지우기 + //서로의 db에 friends로 올리기.

				//me
				var new_friends_NonFacebook_Waiting = me.friends_NonFacebook_Waiting;
				var new_friends_NonFacebook = me.friends_NonFacebook;

				for(var j=0;j<new_friends_NonFacebook_Waiting.length;j++)
					if(new_friends_NonFacebook_Waiting[j].user_id.equals(you._id))
						new_friends_NonFacebook_Waiting.splice(j,1)

				new_friends_NonFacebook.push({"user_id":you._id, "date":now, "user_name":you.nickname, "user_pic_small":you.thumbnail_url_small});

				//you
				var new_friends_NonFacebook_you = you.friends_NonFacebook;
				new_friends_NonFacebook_you.push({"user_id":me._id, "date":now, "user_name":you.nickname, "user_pic_small":you.thumbnail_url_small});

				//나를 좋아하고 있었던 경우에만 you db, friends_requested에 me_id 지우기
				var new_friends_NonFacebook_Requested_you = you.friends_NonFacebook_Requested;
				for(var j=0;j<new_friends_NonFacebook_Requested_you.length;j++)
					if(new_friends_NonFacebook_Requested_you[j].user_id.equals(me._id))
						new_friends_NonFacebook_Requested_you.splice(j,1)

				db_user.update({_id:you._id},{$set:{friends_NonFacebook_Requested : new_friends_NonFacebook_Requested_you, friends_NonFacebook : new_friends_NonFacebook_you}});

				//db update 적용
				db_user.update({_id:ObjectId(me._id)},{$set:{friends_NonFacebook_Waiting:new_friends_NonFacebook_Waiting, friends_NonFacebook:new_friends_NonFacebook}},function(err,update){
					if(err) {console.log("asd2"); return res.status(message.code(1)).json(message.json(1));}
					console.log("asd1"); return res.status(message.code(0)).json(update);
				});

			} else{//아직 나를 좋아하지 않은 경우
				//you db, friends_waiting에 me_id 올리기
				var new_friends_NonFacebook_Waiting = you.friends_NonFacebook_Waiting;

				new_friends_NonFacebook_Waiting.push({"user_id":me._id, "date":now, "me_view_date":null});

				db_user.update({_id:you._id},{$set:{friends_NonFacebook_Waiting : new_friends_NonFacebook_Waiting}}, function(err, update){
					if(err) console.log("err : "+ err);
					if(!update) console.log("!update : " + update);
				});

				//상대가 아직 나를 좋아요하지않은 경우에만 me db, friends_requested에 you_id 올리기
				var new_friends_NonFacebook_Requested = me.friends_NonFacebook_Requested;
				new_friends_NonFacebook_Requested.push({"user_id":you._id,"date":now});

				db_user.update({_id:ObjectId(me._id)},{$set:{friends_NonFacebook_Requested:new_friends_NonFacebook_Requested}},function(err,update){
					if(err) {console.log("asd2"); return res.status(message.code(1)).json(message.json(1));}
					console.log("asd1"); return res.status(message.code(0)).json(update);
				});
			}


			// else{//나를 이미 거절한 경우 (이 경우는 보류)
			//     //you db, friends_waiting에 me_id 올리지않음
			// }





		});


	});
};



exports.rejectYou = function(req, res) {
	if (!req.params.me_id || !req.params.you_id)
		return res.status(message.code(3)).json(message.json(3));

	db_user.findOne( { _id : ObjectId(req.params.me_id) }, function(err,me){
		if (err) return res.status(message.code(1)).json(message.json(1));
		if (!me) return res.status(message.code(1)).json(message.json(1));

		db_user.findOne( { _id : ObjectId(req.params.you_id)}, function(err,you) {
			if (err) return res.status(message.code(1)).json(message.json(1));
			if (!you) return res.status(message.code(1)).json(message.json(1));

			var i = 0;
			var len = you.friends_NonFacebook_Requested.length;

			for (; i < len; i++) {
				if (you.friends_NonFacebook_Requested[i].user_id.equals(me._id))
					break;
			}

			var now = new Date();

			if(i!=len){//상대가 나를 좋아하고있었을 경우
				var new_friends_NonFacebook_Waiting = me.friends_NonFacebook_Waiting;
				var new_friends_NonFacebook_Rejected = me.friends_NonFacebook_Rejected;

				for(var j=0;j<new_friends_NonFacebook_Waiting.length;j++)
					if(new_friends_NonFacebook_Waiting[j].user_id.equals(you._id))
						new_friends_NonFacebook_Waiting.splice(j,1)

				new_friends_NonFacebook_Rejected.push({"user_id":you._id, "date":now});

				db_user.update({_id:me._id},{$set:{friends_NonFacebook_Waiting : new_friends_NonFacebook_Waiting, friends_NonFacebook_Rejected : new_friends_NonFacebook_Rejected}}, function(err, update){
					if(err) return res.status(message.code(1)).json(message.json(1));
					return res.status(message.code(0)).json(update);
				});
			} else{//아직 나를 좋아하지 않은 경우
				var new_friends_NonFacebook_Rejected = me.friends_NonFacebook_Rejected;

				new_friends_NonFacebook_Rejected.push({"user_id":you._id, "date":now});

				db_user.update({_id:me._id},{$set:{friends_NonFacebook_Rejected : new_friends_NonFacebook_Rejected}}, function(err, update){
					if(err) return res.status(message.code(1)).json(message.json(1));
					return res.status(message.code(0)).json(update);
				});
			}


			// else{//나를 이미 거절한 경우 (이 경우는 보류)
			//     //you db, friends_waiting에 me_id 올리지않음
			// }

		});


	});
};



exports.viewUser = function(req, res) {
	if (!req.params.me_id || !req.params.you_id)
		return res.status(message.code(3)).json(message.json(3));

	db_user.findOne( { _id : ObjectId(req.params.you_id) }, function(err,you){
		if (err) return res.status(message.code(1)).json(message.json(1));

		console.log("zzz2")

		//you에 대한 것
		var new_view_cnt = you.view_cnt+1;
		db_user.update(
			{ _id: ObjectId(req.params.you_id) },
			{ $set: {view_cnt : new_view_cnt } },function(err, update){
				if(err) console.log("zzz4 : " + err);
				if(!update) console.log("zzz5 : " + err);
				console.log("zzz3");
			}
		);

		//me에 대한 것

		console.log("zzz");

		var now = new Date();

		db_user.findOne(
			{
				_id: ObjectId(req.params.me_id)},
			function(err, me) {
				var new_friends_NonFacebook_Waiting = me.friends_NonFacebook_Waiting;
				for (var i = 0; i < new_friends_NonFacebook_Waiting.length; i++) {
					console.log("new_friends_NonFacebook_Waiting[i].user_id : " + new_friends_NonFacebook_Waiting[i].user_id);
					console.log("me._id : " + me._id);

					if (new_friends_NonFacebook_Waiting[i].user_id.equals(ObjectId(req.params.you_id))) {
						console.log("1 : " + new_friends_NonFacebook_Waiting[i].me_view_date);
						new_friends_NonFacebook_Waiting[i].me_view_date = now;
						console.log("2 : " + new_friends_NonFacebook_Waiting[i].me_view_date);
					}
				}

				db_user.update(
					{_id: ObjectId(req.params.me_id)},
					{$set: {friends_NonFacebook_Waiting: new_friends_NonFacebook_Waiting}}
					, function (err, update) {
						if(err) console.log(err);
						return res.status(message.code(0)).json(message.json(0));
					}
				);
			}
		);
	});
};


exports.tasteAnalyst = function(req, res) {
    db.collection('food').find( {
	    like_person:{$elemMatch:{user_id:req.params.uid}}
    }).sort({ like_date_ : -1 }).limit(30).skip(0).toArray(function(err, newfeeds) {
	    
	    var foodNameList = [];
	    var tasteList = [];
	    var countryList = [];
	    var cookingList = [];
	    var ingredientList = [];
	    
	    for (var idx=0; idx<newfeeds.length; idx++) {
		    var mFood = newfeeds[idx];
		    foodNameList.push(mFood.name);
	    	for (var idx2=0; idx2<mFood.taste.length; idx2++)
		    	tasteList.push(mFood.taste[idx2]);
	    	for (var idx2=0; idx2<mFood.cooking.length; idx2++)
		    	cookingList.push(mFood.cooking[idx2]);
	    	for (var idx2=0; idx2<mFood.country.length; idx2++)
		    	countryList.push(mFood.country[idx2]);
	    	for (var idx2=0; idx2<mFood.ingredient.length; idx2++)
		    	ingredientList.push(mFood.ingredient[idx2]);
	    }
	    var results = {
			'food_name': foodNameList,
			'tastes': tasteList,
			'countries': countryList,
			'cookings': cookingList,
			'ingredients': ingredientList,
			 
		};
		return res.status(message.code(0)).json(results);
    });
};




















