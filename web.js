console.log("- - - - - - - - - - - - - - - - - - -");
console.log("-");

var express = require('express');
var pg = require('pg');
var utdb = require('./utdb');

var app = express.createServer(express.logger());


var debug_text = '';

app.get('/', function(request, response) {
    response.send('The UtahJS World is AMAZING -- Hello planet -- 13<br>' + debug_text);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});



// DEBUG DATABASE
utdb.onReady(function() {
    console.log("onReady: db ready -- Yeah!");
    var u = "dan3";
    var p = "secretpw3";
    utdb.findUser(u,p,function(result) {
        console.log("onReady: Back in onReady, returned from findUser.");
        if (!result) {
            console.log("onReady: user NOT found. about to call addUser...");
            utdb.addUser(u,p, function(result) {
                if (result) {
                    console.log("onReady: addUser OK:  id="+result.id);
                } else {
                    console.log("onReady: addUser FAILED.  maybe username already exists.")
                }
            });
            console.log("onReady: returned from addUser");
        } else {
            console.log("onReady: user found: id="+result.id);
        }
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


/*
pg.connect(process.env.DATABASE_URL, function(err, client) {
    if (err) {
        console.log("database connection error: "+err);
    } else {
        var query;
    //    var query = client.query('SELECT * FROM your_table');
    //
    //    query.on('row', function(row) {
    //        console.log(JSON.stringify(row));
    //    });


//        var query = client.query('CREATE TABLE users (id SERIAL PRIMARY KEY, uname varchar(20), upw varchar(20))');
//        query.on('end', function() {
//            // table created OR failed
//            console.log("2");
//        });
        console.log("3");
        query = client.query('INSERT INTO users(uname,upw) VALUES($1,$2)', ["danb", "secret"]);
        query.on('end', function() {
            // table created OR failed
            console.log("2");
        });
        console.log("4");
        query = client.query('SELECT * FROM users');
        query.on('row', function(result) {
            if (!result) {
                console.log("nothing selected.  boo hoo");
            } else {
                debug_text += "id:"+result.id+" uname:"+result.uname+" upw:"+result.upw+"<br>";
                console.log("%j", result);
            }
        });
    }
});
*/