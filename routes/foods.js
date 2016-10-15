
const message = require('../message');
var mongo = require('mongodb');
var predictionio = require('predictionio-driver');
var util = require("util");
fs = require('fs');
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
 
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'user' database");
    }
});

//category -> one list
var getlist = function(food){
    var categorys = [food.taste,food.country,food.cooking,food.ingredient];
    var list = new Array;
    var su = 0;
    for(var i =0; i<categorys.length; i++){
            categorys[i].forEach(function(cat){
                    list[su++]=cat;
            });
    }
    return list;
};

//유저 데이터 생성
var initdata = function(su){
    var list = new Array;
    for(var i=0;i<su;i++){
        list[i]= util.format("u%s",i);
    }
    return list;
};

//predictionio createitems ( all )
exports.addAllitem = function(req, res) {
    db.collection('food', function(err, collection) {
        collection.find().toArray(function(err, items) {
            allfoods = items;
            
            items.forEach(function(food){
                console.log('food : ' + getlist(food));

				//item 생성
                client.createItem({
                    iid: food._id,
                    properties: { categories : getlist(food) }, 
                    eventTime: new Date().toISOString()
                }).then(function(result) {
                    console.log("create item"+JSON.stringify(result)); // Prints "{eventId: 'something'}" 
                }).catch(function(err) {
                    console.error(err); // Something went wrong 
                });
        	});
        	
		    //유저 생성
		    initdata(30).forEach(function(name){
		        var rn = Math.floor(Math.random() * 19);
	            client.createUser({uid: name}, function (err,result_pio) {
	                if (!err) console.log('predictionIO createUser :'+JSON.stringify(result_pio));
	            });
	            
                client.createAction({
                    event: 'buy',
                    uid: name,
                    iid: items[rn]._id,
                    eventTime: new Date().toISOString()
                }).then(function(result) {
                    console.log("buy"+JSON.stringify(result)); // Prints "{eventId: 'something'}" 
                }).catch(function(err) {
                    console.error(err); // Something went wrong 
                });

                client.createAction({
                    event: 'view',
                    uid: name,
                    iid: items[rn]._id,
                    eventTime: new Date().toISOString()
                }).then(function(result) {
                        console.log("buy"+JSON.stringify(result)); // Prints "{eventId: 'something'}" 
                }).catch(function(err) {
                    console.error(err); // Something went wrong 
                });
        	});
    	});
    });
    res.send({result:"success"});
};

//predictionio similar result
exports.similarResult = function(req,res){
    pio.sendQuery({items: [req.params.food], num: 1}, function (err, result) {
        if (err) {
        	res.send(err);
        }
        console.log("similar result:"+JSON.stringify(result));
        res.send(result.itemScores);
	});
};

//predictionio recommendation result
exports.recommendationResult = function(req,res){
    pio.sendQuery({user : req.params.user, num: 3}, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log("recommedation result:"+JSON.stringify(result));
        res.send(result.itemScores);
	});
};

//predictionio user buy item
exports.buyitem = function(req,res){
    client.createAction({
        event: 'buy',
        uid: req.params.user,
        iid: req.params.food,
        eventTime: new Date().toISOString()
    }).then(function(result) {
        console.log("LOG[buy] : "+JSON.stringify(result)); // Prints "{eventId: 'something'}" 
        res.send({result:"success"});
    }).catch(function(err) {
        console.error(err); // Something went wrong 
        res.send({result:"fail", message:"exception."});
    });
};
 
exports.findAll = function(req, res) {
    db.collection('food', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};


exports.getFeeds = function(req, res) {
	if (!req.params.uid || !req.params.page)
		return res.status(message.code(3)).json(message.json(3));
		
    db.collection('food', function(err, collection) {
        collection.find().limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
	        
			return res.status(message.code(0)).json(newfeeds);
        });
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
    db.collection('food', function(err, collection) {
        collection.insert({
	        update_date : now,
			create_date : now,
			name : name,
			taste : taste,
			cooking : cooking,
			country : country,
			ingredient : ingredient,
			image_url : "",
			view_cnt : 0,
			like_cnt : 0,
			like_person : list,
			rate_cnt : 0,
			rate_person : list,
			author : author,
			rate_distribution : list
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


 
exports.updateFood = function(req, res) {
    var id = req.params.id;
    var food = req.body;
    console.log('Updating food: ' + id);
    console.log(JSON.stringify(food));
    db.collection('food', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, food, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating food: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(food);
            }
        });
    });
}
 
exports.deleteFood = function(req, res) {
    var id = req.params.id;
    console.log('Deleting food: ' + id);
    db.collection('food', function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}
 
var populateDB = function() {
 
    var foods = [
    {
        name: "CHATEAU DE SAINT COSME",
        year: "2009",
        grapes: "Grenache / Syrah",
        country: "France",
        region: "Southern Rhone",
        description: "The aromas of fruit and spice...",
        picture: "saint_cosme.jpg"
    },
    {
        name: "LAN RIOJA CRIANZA",
        year: "2006",
        grapes: "Tempranillo",
        country: "Spain",
        region: "Rioja",
        description: "A resurgence of interest in boutique vineyards...",
        picture: "lan_rioja.jpg"
    }];
 
    db.collection('food', function(err, collection) {
        collection.insert(foods, {safe:true}, function(err, result) {});
    });
 
};

exports.getImage = function(req, res) {
    var filename = req.params.filename;
    console.log('get Image of food: ' + filename);
    var img = fs.readFileSync('./images/food/' + filename);
     res.writeHead(200, {'Content-Type': 'image/gif' });
     res.end(img, 'binary');
};

exports.getSearchResult = function(req, res){
	var keyword = req.params.keyword;
	console.log('get Search Result : ' + keyword);
	db.collection('food', function(err, collection){
		collection.find({name : {$regex:keyword}}).toArray(function(err, foods){
			var len = foods.length;
			if(len == 0){
				res.send("No result");
			}else{
				res.send(foods);
			}
		});
	});
};
