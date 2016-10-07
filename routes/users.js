var mongo = require('mongodb');
var predictionio = require('predictionio-driver');

// predicitonio
var eventsUrl= process.env.PIOEventUrl || 'http://52.192.137.69';
var eventsPort= process.env.PIOEventPort || '7070';
var queryUrl= process.env.PIOQueryUrl || 'https://52.192.137.69';
var queryPort =  process.env.PIOQueryPort ||'8000';
var appID= parseInt(process.env.PIOAppID || 26);
var accessKey=process.env.PIOAccessKey || 'Wl_qIIHjGfIgDX1L84jqXHQ3ZFLVxb4ejV3Fz6GX4vRzEf7noPO1DxDFfFJJB8mJ';

var client = new predictionio.Events({
                        url:eventsUrl,
                        appId: appID,
                        accessKey:accessKey,
                        strictSSL:false
                });

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
 
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('food', server);
 
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'food' database");
        db.collection('user', {safe:true}, function(err, collection) {
            if (err) {
                console.log("The 'user' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
    }
});
 
exports.addUser = function(req, res) {
    var user = req.body;
    console.log('Adding user: ' + JSON.stringify(user));
    db.collection('user', function(err, collection) {
        collection.insert(user, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else { 
                client.createUser({ uid: user.name }, function (err,result_pio) {
	                if (!err) {
	                    console.log('predictionIO createUser :'+JSON.stringify(result_pio));
	                    console.log('Success: ' + JSON.stringify(result.ops[0]));
	                    res.send(result.ops[0]);
	                }
	        	});
            }
        });
    });
}
 
/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {
 
    var users = [
    {
        name : "샘플"
    }];
 
    db.collection('user', function(err, collection) {
        collection.insert(users, {safe:true}, function(err, result) {});
    });
 
};