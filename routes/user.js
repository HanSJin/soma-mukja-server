
const message = require('../message');
var mongo = require('mongodb');
const crypto = require('crypto');
require('date-utils');



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
    db.collection('user', function(err, collection) {
	    var dt = new Date();
	    dt.setHours(dt.getHours() + 9);  
		var d = dt.toFormat('YYYY-MM-DD HH24:MI:SS');
		
		//get ip Adress - start
		var os = require('os');
		var ifaces = os.networkInterfaces();
		var ip;
		
		Object.keys(ifaces).forEach(function (ifname) {
		  var alias = 0;
		
		  ifaces[ifname].forEach(function (iface) {
		    if ('IPv4' !== iface.family || iface.internal !== false) {
		      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
		      return;
		    }
		
		    if (alias >= 1) {
		      // this single interface has multiple ipv4 addresses
		      console.log(ifname + ':' + alias, iface.address);
		    } else {
		      // this interface has only one ipv4 adress
		      console.log(ifname, iface.address);
		    }
		    ip = iface.address;
		    ++alias;
		  });
		});
		//get ip address - end
		
	    collection.update( { social_id : req.body.user_id }, 
	    {$set:{login_last_date:d, 
		    access_last_date:d, 
		    access_ip:ip},
		 $inc:{login_cnt:1,  access_cnt:1}
		}, 
	    function(err, user) {
			if(err){
				console.log(err);
			}
			res.status(message.code(0)).json(message.json(0));
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
			}else{
				res.send(user);
				//res.status(message.code(2)).json(message.json(2));    //유저 데이터가 이미 존재!
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






