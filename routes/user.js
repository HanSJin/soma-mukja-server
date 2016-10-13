
const message = require('../message');
var mongo = require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
 
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('mukja', server);

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
			if (!user) 
				return res.status(message.code(5)).json(message.json(5, err));
            res.send(user);
        });
    });
};
