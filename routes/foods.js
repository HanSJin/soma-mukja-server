
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
        console.log("Connected to 'user' database");
    }
});

exports.findAll = function(req, res) {
    db.collection('food', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};



exports.getRecommand = function(req, res) {
	if (!req.params.uid)
		return res.status(message.code(3)).json(message.json(3));
		
	var category = req.body.category;
	// NEED SOME LOGICS FOR CURATION.
		
    db.collection('food', function(err, collection) {
        collection.find().sort({ create_date : -1 }).limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
			return res.status(message.code(0)).json(newfeeds);
        });
    });
};


exports.getCategory = function(req, res) {		
	db.collection('category').findOne({}{_id},function(err,category){
		delete _id;
		return res.status(message.code(0)).json(category);
    });
};


exports.getFeeds = function(req, res) {
	if (!req.params.uid || !req.params.page)
		return res.status(message.code(3)).json(message.json(3));
		
    db.collection('food', function(err, collection) {
        collection.find().sort({ create_date : -1 }).limit(10).skip((req.params.page-1)*10).toArray(function(err, newfeeds) {
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
			image_url : image_url,
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


exports.getImage = function(req, res) {
    var filename = req.params.filename;
    console.log('get Image of food: ' + filename);
    var img = fs.readFileSync('./images/food/' + filename);
     res.writeHead(200, {'Content-Type': 'image/gif' });
     res.end(img, 'binary');
};

// image upload(success)
exports.uploadImage = function(req, res) {
    var form = new multiparty.Form();
    
      // file upload handling
      form.on('part',function(part){
           var filename = req.params.image_url+".png";
           var size;
           if (part.filename) {
                 size = part.byteCount;
           }else{
                 part.resume();
          
           }    
 
           console.log("Write Streaming file :"+filename);
           var writeStream = fs.createWriteStream('/home/ec2-user/nodecellar2/soma-mukja-server/public/images/'+filename);
           writeStream.filename = filename;
           part.pipe(writeStream);
 
           part.on('data',function(chunk){
                 console.log(filename+' read '+chunk.length + 'bytes');
           });
          
           part.on('end',function(){
                 console.log(filename+' Part read complete');
                 writeStream.end();
           });
      });
 
      // all uploads are completed
      form.on('close',function(){
           res.status(200).send('Upload complete');
      });
     
      // track progress
      form.on('progress',function(byteRead,byteExpected){
           console.log(' Reading total  '+byteRead+'/'+byteExpected);
      });
     
      form.parse(req);
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
