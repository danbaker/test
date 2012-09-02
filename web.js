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

