
const message = require('../message');
var mongo = require('mongodb');
var predictionio = require('predictionio-driver');
var util = require("util");
fs = require('fs');
var ObjectId = require('mongodb').ObjectID;
var multer = require('multer');
var multiparty = require('multiparty');
var uuid = require('node-uuid');

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
    
    // Returns the server status
client.status().
    then(function(status) {
        console.log(status); // Prints "{status: 'alive'}"
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

var db_food = db.collection('food');
 
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'foods' database");
    }
});


exports.getFood = function(req, res) {
	if (!req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));
	
	db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,food){
		if (err) res.status(message.code(1)).json(message.json(1));
		if (!food) res.status(message.code(1)).json(message.json(1));
		return res.status(message.code(0)).json(food);
	});
};


exports.getRecommand = function(req, res) {
	if (!req.body.group)
		return res.status(message.code(3)).json(message.json(3));
		
	var category = req.body.category;
	// NEED SOME LOGICS FOR CURATION.

	console.log(req.body.taste);
	console.log(req.body.country);
	console.log(req.body.cooking);


	var taste_cnt = req.body.taste.length;
	var country_cnt = req.body.country.length;
	var cooking_cnt = req.body.cooking.length;
		
	if(taste_cnt+country_cnt+cooking_cnt == 0){	
		var recommanded_food_list = [];
		var list_food = new Array();
			
		pio.sendQuery({users : req.body.group, num: 10})
		.then( function (result) {
	    	if(result){
	    		for(var i=0;i<result.itemScores.length;i++){
		    		list_food[i] = ObjectId(result.itemScores[i].item);
		    		console.log("list_food[i] : " + list_food[i]);
    			}
				recommanded_food_list.push({ _id : { $in: list_food}});
				
				//console.log("recommanded_food_list : " + JSON.stringify(recommanded_food_list[0]));
	
				db.collection('food').find({$or:recommanded_food_list}).
				limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
				    if(err){
					    console.log(err);
				    	return res.status(message.code(0)).json({ listFood : newfeeds, algo : result.itemScores[0].algo});
				    }
				    //console.log(newfeeds);
					return res.status(message.code(0)).json({ listFood : newfeeds, algo : result.itemScores[0].algo});
				});
			}
		});	
	}else{//카테고리 검색옵션 선택안했을 때
	    var index = 0;
		var main = new Array();
		if(req.body.taste.length > 0){
			var list = new Array();
			for (var idx=0; idx<req.body.taste.length; idx++) {
				list[idx] = req.body.taste[idx];
			}
			main[index++] = { taste : { $in: list } };
    	}
		if(req.body.country.length > 0){	    	var list = new Array();
			for (var idx=0; idx<req.body.country.length; idx++) {
				list[idx] = req.body.country[idx];
			}
			main[index++] = { country : { $in: list } };  	
		}
		if(req.body.cooking.length > 0){			var list = new Array();
			for (var idx=0; idx<req.body.cooking.length; idx++) {
				list[idx] = req.body.cooking[idx];
			}
			main[index++] = { cooking : { $in: list } };
	    }
	    			
	    if(taste_cnt+country_cnt+cooking_cnt == 1){
		    db.collection('food').find({$or: main})
		    	.sort({ create_date : -1 }).limit(10)
		    	.skip((req.params.page-1)*10)
		    	.toArray(function(err, newfeeds) {				
				    return res.status(message.code(0)).json({ listFood : newfeeds, algo : 9});
	    	});	
	    }else{
		  	db.collection('food').find({$and: main})
		  		.sort({ create_date : -1 }).limit(10)
		  		.skip((req.params.page-1)*10)
		  		.toArray(function(err, newfeeds) {				
			  		return res.status(message.code(0)).json({ listFood : newfeeds, algo : 9});
	    	});	
		}
	}
	  	
	 
};


exports.getCategory = function(req, res) {		
	db.collection('category').findOne( { }, { _id: 0 },function(err,category){
		delete _id;
		return res.status(message.code(0)).json(category);
    });
};


exports.getFeeds = function(req, res) {
	if (!req.params.uid || !req.params.page)
		return res.status(message.code(3)).json(message.json(3));
		
    db.collection('food').find().sort({ create_date : -1 }).limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
		return res.status(message.code(0)).json(newfeeds);
    });
};


exports.myFoodList = function(req, res) {
	if (!req.params.uid)
		return res.status(message.code(3)).json(message.json(3));
	
    db.collection('food').find( {
	    like_person:{$elemMatch:{user_id:req.params.uid}}
	    //like_person : req.params.uid
    }).sort({ create_date : -1 }).limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
		return res.status(message.code(0)).json(newfeeds);
    });
};


exports.getExplore = function(req, res) {
    db.collection('explore').find({}, {_id : 0}).toArray(function(err, defaultExplore) {
		return res.status(message.code(0)).json(defaultExplore);
    });
};


exports.rankList = function(req, res) {
	if (!req.params.uid || !req.params.page)
		return res.status(message.code(3)).json(message.json(3));
		
    db.collection('food').find().sort({ create_date : -1 }).limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
		return res.status(message.code(0)).json(newfeeds);
    });
};
exports.addFood = function(req, res) {
	//var now = new Date();
	var now = req.body.update_date;
	var name = req.body.name;
	var taste = req.body.taste;
	var cooking = req.body.cooking;
	var country = req.body.country;
	var ingredient = req.body.ingredient;
	var author = req.body.author;
	var image_url = req.body.image_url;
	var list = new Array();
	var list_rate = new Array(0,0,0,0,0,0,0,0,0,0);
	
	var rate_person = req.body.rate_person;
	var temp = (rate_person[0].rate_num / 0.5)-1;
	list_rate[temp] += 1;

	
    db.collection('food', function(err, collection) {
        collection.insert({
	        update_date : now,
			create_date : now,
			name : name,
			taste : taste,
			cooking : cooking,
			country : country,
			ingredient : ingredient,
			image_url : image_url,
			view_cnt : 0,
			like_cnt : 0,
			like_person : list,
			rate_cnt : 1,
			rate_person : rate_person,
			author : author,
			rate_distribution : list_rate,
			comment_cnt : 0,
			comment_person : list
        }, function(err, food) {
			if(err){
				res.status(message.code(1)).json(message.json(1));
			}		   
			var categories = [];
			for (var idx=0; idx<taste.length; idx++) {
				categories.push(taste[idx]);
			}
			for (var idx=0; idx<cooking.length; idx++) {
				categories.push(cooking[idx]);
			}
			for (var idx=0; idx<country.length; idx++) {
				categories.push(country[idx]);
			}
			console.log(categories);
            client.createItem( 
            	{ 
	            	iid: food.ops[0]._id ,
	            	properties: {
						itypes: categories
    				},
					eventTime: new Date().toISOString()
	            }, function (err,result_pio) {
                if (!err) console.log('predictionIO createItem :'+JSON.stringify(result_pio));
            }).then(function(result) {
	            db.collection('user').findOne( {_id: ObjectId(author.author_id)}, function(err, user){
				    if (err) res.status(message.code(1)).json(message.json(1));
					if (!user) res.status(message.code(1)).json(message.json(1));
				    
				    var new_rated_food_num = user.rated_food_num+1;
					
					db.collection('user').update(
						{ _id: ObjectId(author.author_id)},
						{ $set: {rated_food_num: new_rated_food_num}}
					);
			    });

				res.send(food.ops[0]);
            }).catch(function(err) {
		        console.error(err); // Something went wrong 
		    });
        });
    });
}


exports.report = function(req, res) {
	if (!req.params.uid || !req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));
	return res.status(message.code(0)).json(message.json(0));
};


exports.like = function(req, res) {
	if (!req.params.uid || !req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));
		
	db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,food){
		if (err) res.status(message.code(1)).json(message.json(1));
		if (!food) res.status(message.code(1)).json(message.json(1));
		
		var new_like_cnt = food.like_cnt;
		var new_like_person = food.like_person;
		var temp_like_person = food.like_person;
		
		var now = new Date();
		now.setHours(now.getHours());

		
		var isliked = false;
		
		for (var idx=0; idx<new_like_person.length; idx++) {
			if (new_like_person[idx].user_id == req.params.uid) {
				isliked = true;
				new_like_cnt--;
				new_like_person.splice(idx, 1);
				client.createAction({
			        event: 'cancel_like',
			        uid: req.params.uid,
			        iid: req.params.food_id,
			        eventTime: new Date().toISOString()
			    });
				break;
			}
		}
		
		// 좋아요
		if (!isliked) {
			new_like_cnt++;
			new_like_person.push({user_id:req.params.uid,like_date_:now});
			
			client.createAction({
		        event: 'like',
		        uid: req.params.uid,
		        iid: req.params.food_id,
		        eventTime: new Date().toISOString()
		    });
		}
		db.collection('food').update( 
			{ _id: ObjectId(req.params.food_id) }, 
			{ $set: {like_cnt : new_like_cnt, like_person : new_like_person } },
			function(err, update) {
				if(err) console.log(err);
				db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,update_food){
					if (err) res.status(message.code(1)).json(message.json(1));
					if (!update_food) res.status(message.code(1)).json(message.json(1));
					return res.status(message.code(0)).json(update_food);
				});
			}
		);	
    });
};

// SMAPLE
exports.foodBuy = function(req, res) {
	client.createAction({
        event: 'like',
        uid: req.params.uid,
        iid: req.params.food_id,
        eventTime: new Date().toISOString()
    });
    return res.status(message.code(0)).json(message.json(0));
};
exports.foodViewTest = function(req, res) {
	client.createAction({
        event: 'view',
        uid: req.params.uid,
        iid: req.params.food_id,
        eventTime: new Date().toISOString()
    });
    return res.status(message.code(0)).json(message.json(0));
};

exports.foodRecommandTest = function(req, res) {
	/*
	pio.sendQuery({user : req.params.uid, num: 300}, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(message.code(5)).json(message.json(5));
        }
        
        else {
	        //console.log(result.itemScores[0].item);
	        console.log("result : " + result.itemScores.length);
	        return res.status(message.code(0)).json(result.itemScores);
	    }
    });
    */
    
    pio.sendQuery({user : req.params.uid, num: 300})
	.then( function (result) {
    	if(result)
	    	return res.status(message.code(0)).json(result.itemScores);
        	
        else
            return res.status(message.code(5)).json(message.json(5));
  	});
   
};

        

exports.viewFood = function(req, res) {
	if (!req.params.uid || !req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));
		
	db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,food){
        client.createAction({
            event: 'view',
            uid: req.params.uid,
            iid: req.params.food_id,
            eventTime: new Date().toISOString()
        }).then(function(result) {
			if (err) res.status(message.code(1)).json(message.json(1));
			var new_view_cnt = food.view_cnt+1;		
			db.collection('food').update( 
				{ _id: ObjectId(req.params.food_id) }, 
				{ $set: {view_cnt : new_view_cnt } },
			function(err, update) {
				return res.status(message.code(0)).json(message.json(0));
			});	
        }).catch(function(err) {
			if (err) res.status(message.code(5)).json(message.json(5));
        });
    });
};


exports.rate = function(req, res) {
	if (!req.params.uid || !req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));
		
	db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,food){
		if (err) res.status(message.code(1)).json(message.json(1));
		if (!food) res.status(message.code(1)).json(message.json(1));
		
		var new_rate_cnt = food.rate_cnt;
		
		var old_rate_person = food.rate_person;
		var new_rate_person = req.body.rate_person;
		
		var new_rate_distribution = food.rate_distribution;
		
		var now = new Date();
		now.setHours(now.getHours());

		
		var israted = false;
		for (var idx=0; idx<old_rate_person.length; idx++) {
			if (old_rate_person[idx].user_id == req.params.uid) {
				israted = true;
				var i = (old_rate_person[idx].rate_num)*2-1;
				new_rate_distribution[i] -= 1;
				old_rate_person.splice(idx, 1);
				break;
			}
		}
				
		var temp = new_rate_person.shift();
		if (!israted) {
			new_rate_cnt++;
			db.collection('user').findOne( {_id: ObjectId(req.params.uid)}, function(err, user){
			    if (err) res.status(message.code(1)).json(message.json(1));
				if (!user) res.status(message.code(1)).json(message.json(1));
			    
			    var new_rated_food_num = user.rated_food_num+1;
				
				db.collection('user').update(
					{ _id: ObjectId(req.params.uid)},
					{ $set: {rated_food_num: new_rated_food_num}}
				);
		    });
		}

		
		old_rate_person.push({user_id:temp.user_id, rate_num:temp.rate_num, rate_date : now});
		
		var i = temp.rate_num*2-1;
		new_rate_distribution[i] += 1;
				
		db.collection('food').update( 
			{ _id: ObjectId(req.params.food_id) }, 
			{ $set: {rate_cnt : new_rate_cnt, rate_person : old_rate_person, rate_distribution : new_rate_distribution} }
			, function(err, update) {
				client.createAction({
			        event: 'rate',
			        uid: req.params.uid,
			        iid: req.params.food_id,
	            	properties: {
						rating: old_rate_person[0].rate_num
    				},
			        eventTime: new Date().toISOString() 
			    }).then(function(result) {
					db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,update_food){
						if (err) res.status(message.code(1)).json(message.json(1));
						if (!update_food) res.status(message.code(1)).json(message.json(1));
						return res.status(message.code(0)).json(update_food);
					});
			    }).
			    catch(function(err) {
			        console.error(err); // Something went wrong 
			    });
			}
		);	
    });
};


exports.likePersons = function(req, res) {
	if (!req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));
		
	db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, /* { _id : 0, like_person : 1}, */ function(err, food_person){
		if (err) res.status(message.code(1)).json(message.json(1));
		if (!food_person) res.status(message.code(1)).json(message.json(1));

		var condition = [];
		for (var idx=0; idx<food_person.like_person.length; idx++) {
			condition.push({ _id: new ObjectId(food_person.like_person[idx].user_id) });
		}
		
		if(condition.length == 0){
			res.send(null);
		}else{
		    db.collection('user').find( { $or: condition }).toArray(function(err, persons){	
			    res.send(persons);
				return res.status(message.code(0)).json(persons);
			});
		}
	});
};


exports.getImage = function(req, res) {
    var filename = req.params.filename;
    var img = fs.readFileSync('./images/food/' + filename);
    res.writeHead(200, {'Content-Type': 'image/gif' });
    res.end(img, 'binary');
};


exports.getSearchResult = function(req, res){
	var keywordlist = new Array();
	keywordlist[0] = req.params.keyword;
	
	var main = new Array();
	main[0] = { name : {$regex:req.params.keyword} };
	main[1] = { taste : req.params.keyword };
	main[2] = { country : req.params.keyword };
	main[3] = { cooking : req.params.keyword };
			
	db.collection('food').find({$or: main}).toArray(function(err, foods) {				
		var len = foods.length;
		if(len == 0){
			res.send("No result");
		}else{
			res.send(foods);
		}
	});	
};


exports.getFoodsForUser = function(req, res){
	var uid = req.params.uid;
	//나중에 각각 유저마다 음식평가 화면에 음식 목록들 다 다르게 주기위해서(큐레이션) 일단 user_id를 받아오는 것만.
    db.collection('food', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};


exports.foodImageUpload = function(req, res){
	if (!req.params.food_id) return res.status(message.code(3)).json(message.json(3));

	db.collection('food').update( 
		{ _id: ObjectId(req.params.food_id) }, 
		{ $set: {image_url : req.file.filename} },
		function(err, update) {
			db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,update_food){
				if (err) return res.status(message.code(1)).json(message.json(1));
				if (!update_food) return res.status(message.code(1)).json(message.json(1));
				return res.status(message.code(0)).json(update_food);
			});
		}
	);			
};


exports.recommandFoodResult = function(req,res){
	pio.sendQuery({user : req.params.uid, num: 10}, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(message.code(5)).json(message.json(5));
        }
        else return res.status(message.code(0)).json(result.itemScores);
    });
};


exports.commentFood = function(req, res){
	if(!req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));

	db_food.findOne({_id:ObjectId(req.params.food_id)}, function(err, food){
		if(err) console.log("err : " + err);

		var new_comment_person = food.comment_person;
		var new_comment_cnt = food.comment_cnt + 1;
		var now = new Date();
		var list = new Array();

		new_comment_person.push(
			{
				comment_id:uuid(now),
				user_id:req.body.me_id,
				user_name: req.body.me_name,
				comment:req.body.comment,
				comment_date:now,
				thumbnail_url_small: req.body.thumbnail_url,
				re_comment_person: list
			}
		);

		console.log("req.body.thumbnail_url : " + req.body.thumbnail_url);



		db_food.update({_id:ObjectId(req.params.food_id)}, {$set:{comment_person: new_comment_person, comment_cnt:new_comment_cnt}});

		db_food.findOne({_id:ObjectId(req.params.food_id)}, function(err, food){
			if(err) console.log("err : "+err);
			if(!food) console.log("food : "+food);

			console.log("req.params.food_id : " + food._id);
			console.log("1 : " + food.report_cnt);
			console.log(food.comment_person);
			return res.status(message.code(0)).json(food.comment_person);
		})
	});


}


exports.getCommentFood = function(req, res){
	if(!req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));

	db_food.findOne({_id:ObjectId(req.params.food_id)}, function(err, food){
		return res.status(message.code(0)).json(food.comment_person);
	});


}


exports.getOneCommentFood = function(req, res){
	if(!req.params.food_id || !req.params.comment_id )
		return res.status(message.code(3)).json(message.json(3));

	db_food.findOne({_id:ObjectId(req.params.food_id)}, function(err, food){
		var new_comment_person = food.comment_person;
		var new_comment_person_one = new Array();

		for(var i=0;i<new_comment_person.length;i++) {
			if (new_comment_person[i].comment_id == req.params.comment_id) {
				console.log(i);
				new_comment_person_one.push(new_comment_person[i])
			}
		}

		for(var i=0;i<new_comment_person_one.length;i++)
			console.log(i + " : " + new_comment_person_one[i]);
		return res.status(message.code(0)).json(new_comment_person_one);
	});
}


exports.oneCommentFood= function(req, res){
	if(!req.params.food_id && !req.params.comment_id)
		return res.status(message.code(3)).json(message.json(3));

	console.log("makejin2");
	db_food.findOne({_id:ObjectId(req.params.food_id)}, function(err, food){
		if(err) console.log("err : " + err);

		var now = new Date();
		var new_comment_person = food.comment_person;

		for(var i=0;i<food.comment_person.length;i++)
			if(new_comment_person[i].comment_id == req.params.comment_id)
				new_comment_person[i].re_comment_person.push(
					{
						user_id: req.body.me_id,
						user_name: req.body.me_name,
						comment: req.body.comment,
						comment_date: now,
						thumbnail_url_small: req.body.thumbnail_url
					}
				);

		db_food.update({_id:ObjectId(req.params.food_id)}, {$set:{comment_person: new_comment_person}});

		db_food.findOne({_id:ObjectId(req.params.food_id)}, function(err, food){
			if(err) console.log("err : "+err);
			if(!food) console.log("food : "+food);

			return res.status(message.code(0)).json(food.comment_person);
		})
	});


}
