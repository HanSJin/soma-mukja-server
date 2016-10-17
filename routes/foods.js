
const message = require('../message');
var mongo = require('mongodb');
var predictionio = require('predictionio-driver');
var util = require("util");
fs = require('fs');
var ObjectId = require('mongodb').ObjectID;
var multer = require('multer');
var multiparty = require('multiparty');

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
	if (!req.params.uid)
		return res.status(message.code(3)).json(message.json(3));
		
	var category = req.body.category;
	// NEED SOME LOGICS FOR CURATION.
	
	var taste_cnt = req.body.taste.length;
	var country_cnt = req.body.country.length;
	var cooking_cnt = req.body.cooking.length;
		
	if(taste_cnt+country_cnt+cooking_cnt == 0){	
	    db.collection('food').find().limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
			return res.status(message.code(0)).json(newfeeds);
		});	
    }else{
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
				    return res.status(message.code(0)).json(newfeeds);
	    	});	
	    }else{
		  	db.collection('food').find({$and: main})
		  		.sort({ create_date : -1 }).limit(10)
		  		.skip((req.params.page-1)*10)
		  		.toArray(function(err, newfeeds) {				
			  		return res.status(message.code(0)).json(newfeeds);
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
	    like_person : req.params.uid
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


exports.rankPost = function(req, res) {
	if (!req.params.uid || !req.params.food_id || !req.params.rate)
		return res.status(message.code(3)).json(message.json(3));
		
	db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,food){
		if (err) res.status(message.code(1)).json(message.json(1));
		if (!food) res.status(message.code(1)).json(message.json(1));
		
		var new_rate_cnt = food.rate_cnt;
		var new_rate_person = food.rate_person;
		var new_rate_distribution = food.rate_distribution;
		
		var isranked = false;
		var rank_cnt = 0;
		for (var idx=0; idx<new_rate_person.length; idx++) {
			if (new_rate_person[idx] == req.params.uid) {
				isranked = true;
			}
		}
		if (!isranked) {
			new_rate_person.push(req.params.uid);
			new_rate_distribution.push(req.params.rate);
			new_rate_cnt++;
		}
		
		db.collection('food').update( 
			{ _id: ObjectId(req.params.food_id) }, 
			{ $set: {rate_cnt : new_rate_cnt, rate_person : new_rate_person, rate_distribution : new_rate_distribution} },
			function(err, update) {
				db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,update_food){
					if (err) res.status(message.code(1)).json(message.json(1));
					if (!update_food) res.status(message.code(1)).json(message.json(1));
					return res.status(message.code(0)).json(update_food);
				});
			}
		);	
	});
};

 
exports.addFood = function(req, res) {
	var now = new Date();
	var name = req.body.name;
	var taste = req.body.taste;
	var cooking = req.body.cooking;
	var country = req.body.country;
	var ingredient = req.body.ingredient;
	var author = req.body.author;
	var image_url = req.body.image_url;
	var list = new Array();
	var list_rate = [0,0,0,0,0,0,0,0,0,0];
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
			rate_cnt : 0,
			rate_person : list,
			author : author,
			rate_distribution : list_rate
        }, function(err, food) {
			if(err){
				res.status(message.code(1)).json(message.json(1));    //유저 데이터 생성 성공! 코드 몇번?
			}		   
			res.send(food.ops[0]);
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
		
		var isliked = false;
		for (var idx=0; idx<new_like_person.length; idx++) {
			if (new_like_person[idx] == req.params.uid) {
				isliked = true;
				new_like_cnt--;
				new_like_person.splice(idx, 1);
				break;
			}
		}
		
		// 좋아요
		if (!isliked) {
			new_like_cnt++;
			new_like_person.push(req.params.uid);
		}
		db.collection('food').update( 
			{ _id: ObjectId(req.params.food_id) }, 
			{ $set: {like_cnt : new_like_cnt, like_person : new_like_person } },
			function(err, update) {
				db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,update_food){
					if (err) res.status(message.code(1)).json(message.json(1));
					if (!update_food) res.status(message.code(1)).json(message.json(1));
					return res.status(message.code(0)).json(update_food);
				});
			}
		);	
    });
};


exports.viewFood = function(req, res) {
	if (!req.params.uid || !req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));
		
	db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,food){
		if (err) res.status(message.code(1)).json(message.json(1));
		
		var new_view_cnt = food.view_cnt+1;		
		db.collection('food').update( 
			{ _id: ObjectId(req.params.food_id) }, 
			{ $set: {view_cnt : new_view_cnt } },
		function(err, update) {
			return res.status(message.code(0)).json(message.json(0));
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
		var new_rate_person = req.body.rate_person;
		var new_rate_distribution = food.rate_distribution;
		
		var israted = false;
		for (var idx=1; idx<new_rate_person.length; idx++) {
			if (new_rate_person[idx].user_id == req.params.uid) {
				israted = true;
				var i = (new_rate_person[idx].rate_num)*2-1;
				new_rate_distribution[i] -= 1;
				new_rate_person.splice(idx, 1);
				break;
			}
		}
		
		if (!israted) {
			new_rate_cnt++;
		}
		
		var i = new_rate_person[0].rate_num*2-1;
		new_rate_distribution[i] += 1;
				
		db.collection('food').update( 
			{ _id: ObjectId(req.params.food_id) }, 
			{ $set: {rate_cnt : new_rate_cnt, rate_person : new_rate_person, rate_distribution : new_rate_distribution } },
			function(err, update) {
				db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, function(err,update_food){
					if (err) res.status(message.code(1)).json(message.json(1));
					if (!update_food) res.status(message.code(1)).json(message.json(1));
					return res.status(message.code(0)).json(update_food);
				});
			}
		);	
    });
};


exports.likePersons = function(req, res) {
	if (!req.params.food_id)
		return res.status(message.code(3)).json(message.json(3));
		
	db.collection('food').findOne( { _id : ObjectId(req.params.food_id) }, { _id : 0, like_person : 1}, function(err, food_person){
		if (err) res.status(message.code(1)).json(message.json(1));
		if (!food_person) res.status(message.code(1)).json(message.json(1));

		var condition = [];
		for (var idx=0; idx<food_person.like_person.length; idx++) {
			condition.push({ _id: new ObjectId(food_person.like_person[idx]) });
		}
	    db.collection('user').find( { $or: condition }).toArray(function(err, persons){	
			return res.status(message.code(0)).json(persons);
		});
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
	main[0] = { name : req.params.keyword };
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
				if (err) res.status(message.code(1)).json(message.json(1));
				if (!update_food) res.status(message.code(1)).json(message.json(1));
				return res.status(message.code(0)).json(update_food);
			});
		}
	);			
};
