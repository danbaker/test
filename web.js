console.log(" ");
console.log(" ");
console.log(" ");
console.log("- - - - - - - - - - - - - - - - - - -");
console.log("-");

var port = process.env.PORT || 5000;
var express = require('express');
var pg = require('pg');
var utdb = require('./utdb');
var app = express.createServer();
var mongo = require('mongodb');

var store  = new express.session.MemoryStore;
app.configure( function() {
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use('/', express.static(__dirname + '/public'));
    app.use(express.session({ secret: 'UtahJavaScriptHash', store:store }));
});

// setup routes and start the server
var routes = require('./routes')(app);


utdb.onReady(function() {
    console.log("onReady: db ready -- Yeah!");
    app.listen(port, function() {
        console.log("Listening on " + port);
    });
});
//// NOTE: To try to login:
//utdb.findUser(username,password, function(result) {
//    if (result) {
//        user_id = result.id;    // logged in
//    } else {
//        // FAILED TO LOGIN
//    }
//});
//// NOTE: To create a new user:
//utdb.addUser(username, password, function(result) {
//    if (result) {
//        // user added AND logged in as result.id
//    } else {
//        // FAILED to add user
//    }
//});


/// * * * DEBUG * * *
//var dbURL = process.env.MONGOLAB_URI;   // URL to THE database
//var isLocal = (dbURL? false : true);
//if (!isLocal) {
//    mongo.connect(dbURL, {}, function(error, db) {
//
//        // console.log will write to the heroku log which can be accessed via the
//        // command line as "heroku logs"
//        db.addListener("error", function(error){
//            console.log("Error connecting to MongoLab: %j", error);
//        });
//
//        db.createCollection('users', function(err, collection) {
//            if (err) console.log("createCollection error: %j", err);
//            db.collection('users', function(err, collection) {
//                if (err) console.log("collection error: %j", err);
//                var userCollection = collection;
//                // force the "username" to be unique (can't have two users with the same username)
//                userCollection.ensureIndex({uname:1},{unique:true});
//                userCollection.insert({uname:"dan2", upw:"secret2", auth: 1}, function(err, result) {
//                    if (err) console.log("insert error: %j", err);
//                    console.log("...Result from user collection insert: %j", result);
//                    var id = result[0]._id;
//                    console.log("About to check if actually inserted...look for "+id);
//                    if (id) {
//                        console.log("find id: "+id);
//                        userCollection.find({id:id}).limit(3).forEach(function(x) {
//                            console.log(x)
//                        });
//                        console.log("NOT found");
//                    }
//                })
//            })
//        });
//
//    //    db.createCollection('requests', function(err, collection){
//    //        db.collection('requests', function(err, collection){
//    //            var requestCollection = collection;
//    //            connect(
//    //                connect.favicon(), // Return generic favicon
//    //                connect.query(), // populate req.query with query parameters
//    //                connect.bodyParser(), // Get JSON data from body
//    //                function(req, res, next){ // Handle the request
//    //                    res.setHeader("Content-Type", "application/json");
//    //                    if(req.query != null) {
//    //                        requestCollection.insert(req.query, function(error, result){
//    //                            // result will have the object written to the db so let's just
//    //                            // write it back out to the browser
//    //                            res.write(JSON.stringify(result));
//    //                        });
//    //                    }
//    //
//    //                    res.end();
//    //                }
//    //            ).listen(process.env.PORT || 8080);
//    //            // the PORT variable will be assigned by Heroku
//    //        });
//    //    });
//    });
//}