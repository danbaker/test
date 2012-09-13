/*
    TABLE:  users
    COLUMNS:
        id      // auto assigned integer
                // is used as the "id" for this user (stored in the session)
        uname   // string -- the username (email adddress)
        upw     // string -- the users password (encrypted)
        auth    // int -- the authorization level for this user (set bits mean special authorizations)
            0    = default auth. "normal" user (has no special authorization)
            01   = logged in
            02   = can change auth values for all users
            04   =
            08   =
            10   =
            20   =
            40   =
            80   =
            FF   = super-user (can do ANYTHING)
 */
var mdbURL = process.env.MONGOLAB_URI;   // URL to THE database
var isLocal = (mdbURL? false : true);
var nhash = require('node_hash');
var pg;
var mongo;
if (!isLocal) {
    pg = require('pg');
    mongo = require('mongodb');
}

var userCollection;             // the "users" collection


var theClient = undefined;              // the database-client-connection object
var onReadyFncs = [];


// function to call to NOT log message to console
var nillFunction = function() {
};
var trace;
trace = console.log;                // report all trace messages to console
//trace = nillFunction;             // ignore all trace messages

// function to run when database is ready to use
var doOnReadyNow = function() {
    if (theClient || userCollection) {
        process.nextTick(function() {
            for(var i=0; i<onReadyFncs.length; i++) {
                onReadyFncs[i]();
            }
            onReadyFncs = [];
        });
    }
};

if (isLocal) {
    // SIMULATE like we have a database
    console.log("LOCAL TESTING.  NO DATABASE.");
    process.nextTick(function() {
        process.nextTick(function() {
            for(var i=0; i<onReadyFncs.length; i++) {
                onReadyFncs[i]();
            }
            onReadyFncs = [];
        });
    });
} else {

    // establish THE connection to THE MongoLabs database
    trace("About to connect to MongoLabs");
    mongo.connect(mdbURL, {}, function(error, db) {
        trace("...connected to MongoLabs");

        db.addListener("error", function(error){
            console.log("Error connecting to MongoLab: %j", error);
        });

        // create each collection
        db.createCollection('users', function(err, collection) {
            if (err) console.log("createCollection error: %j", err);
            db.collection('users', function(err, collection) {
                if (err) console.log("collection error: %j", err);
                userCollection = collection;
                // force the "username" to be unique (can't have two users with the same username)
                userCollection.ensureIndex({uname:1},{unique:true});

                //
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
//                });
                doOnReadyNow();
            });
        });

        // @TODO: create other collections here ...

        //    db.createCollection('requests', function(err, collection){
        //        db.collection('requests', function(err, collection){
        //            var requestCollection = collection;
        //            connect(
        //                connect.favicon(), // Return generic favicon
        //                connect.query(), // populate req.query with query parameters
        //                connect.bodyParser(), // Get JSON data from body
        //                function(req, res, next){ // Handle the request
        //                    res.setHeader("Content-Type", "application/json");
        //                    if(req.query != null) {
        //                        requestCollection.insert(req.query, function(error, result){
        //                            // result will have the object written to the db so let's just
        //                            // write it back out to the browser
        //                            res.write(JSON.stringify(result));
        //                        });
        //                    }
        //
        //                    res.end();
        //                }
        //            ).listen(process.env.PORT || 8080);
        //            // the PORT variable will be assigned by Heroku
        //        });
        //    });
    });
}



// establish THE connection to THE database
//pg.connect(process.env.DATABASE_URL, function(err, client) {
//    if (err) {
//        console.log("database connection error: "+err);
//    } else {
//        // NOTE: DO HERE: Handle database migration here ...
//        var query;
//
//        query = client.query('CREATE TABLE users (id SERIAL PRIMARY KEY, uname varchar(20) NOT NULL UNIQUE, upw varchar(40) NOT NULL, auth SMALLINT NOT NULL)');
//        query.on('end', function() {
//                // if didn't fail, then create happened
//
//            }).on('error', function(err) {
//                // failed to create table (already existed?)
//                query = client.query('ALTER TABLE users ADD COLUMN auth SMALLINT NOT NULL DEFAULT 0');
//                query.on('end', function() {
//
//                    }).on('error', function(err) {
//
//                    });
//            });
//        theClient = client;
//        doOnReadyNow();
//    }
//});
//}


// encrypt (hash) a password
var encryptPW = function(pw, user) {
    var h = nhash.md5(pw);
    var salt;
    var fnc;
    var nTimes = 50+pw.length*3+user.length*7;
    for(var n=nTimes; n>0; n--) {
        salt = undefined;
        // Note: the last 7 iteration, just hash the previous hash (w/o adding in the original user/pw)
        if (n > 7) {
            switch (n % 7) {
                case 0:  h += user; break;
                case 1:  h = user + h; break;
                default: salt = user; break;
                case 3:  h += pw; break;
                case 4:  h = pw + h; break;
                case 5:  salt = pw; break;
                case 6:  salt = "UtahJSisBeyondAwesomeInTheYear2012";
            }
        }
        switch (n % 3) {
            default: fnc = nhash.md5; break;
            case 1:  fnc = nhash.sha1; break;
            case 2:  fnc = nhash.sha256; break;
        }
        for(var i=0; i<n/3+2+pw.length+user.length; i++) {
            h = fnc(h, salt);
        }
    }
    // shrink it down, one last time
    h = nhash.md5(h);
    return h;
};

// check if the database has been connected to, and is ready to use
// return: true IF the database is ready to use
exports.isReady = function() {
    return !!theClient || !!userCollection;
};

// return the database-client-connection object
getClient = function() {
    if (theClient) {
        if (theClient.connection && theClient.connection.stream && theClient.connection.stream.destroyed) {
            console.log("utdb.getClient -- connection is destroyed");
            // NOTE: Playing with this is confusing.  destroyed is set to true sometimes, but magically re-connects
//            theClient = undefined;
//            pg.connect(process.env.DATABASE_URL, function(err, client) {
//                if (err) {
//                    console.log("database connection error: "+err);
//                } else {
//                    theClient = client;
//                }
//            });
        }
    }
    return theClient;
};
exports.getClient = getClient;

// find a user in the user table
exports.findUser = function(name, opw, fnc) {
    var pw = encryptPW(opw, name);
    trace("findUser u="+name+" pw="+pw);

//    if (theClient) {
//        var fncCalled = false;
//        var query = getClient().query("SELECT id,auth FROM users WHERE uname=$1 AND upw=$2", [name,pw]);
//        trace("findUser 3: query=%j",query);
//        query.on('row', function(result) {
//                trace("findUser: got a row:  %j",result);
//                if (result) {
//                    fncCalled = true;
//                    fnc(result);
//                }
//            }).on('end', function() {
//                trace("findUser: on END");
//                if (!fncCalled) {
//                    fncCalled = true;
//                    fnc(undefined);
//                }
//            }).on('error', function(err) {
//                console.log("findUser: ERROR %j", err);
//            });
//        trace("findUser: 4");
//    } else {
//        if (!fncCalled) {
//            fncCalled = true;
//            fnc(undefined);
//        }
//    }
    if (userCollection) {
        if (fnc) {
            userCollection.find({uname:name, upw:pw}, function(err, result) {
                if (err || !result) {
                    fnc(undefined);
                } else {
                    console.log("RESULT:");
                    console.log(result);
                    result.nextObject(function(err, result) {
                        if (!fncCalled) {
                            var obj = {uname:result.uname, id:result._id, auth:result.auth};
                            console.log("Returning found user: %j", obj);
                            fncCalled = true;
                            fnc(obj);
                        }
                    });
                }
            });
        }
//        var cur = userCollection.find({uname:name, upw:pw}).limit(1);
//        if (cur && cur.hasNext()) {
//            result = cur.next();
//            var obj = {uname:result.uname, id:result._id, auth:result.auth};
//            console.log("Returning found user: %j", obj)
//            fnc(obj);
//        }
    }
};

// add a new user to the system
exports.addUser = function(name, opw, fnc) {
    var epw = encryptPW(opw, name);
    trace("addUser: u="+name+"  pw="+epw);
//    if (theClient) {
//        var query = getClient().query('INSERT INTO users(uname,upw) VALUES($1,$2)', [name,epw]);
//        trace("addUser: query=%j", query);
//        query.on('end', function() {
//                // user inserted OK
//                trace("addUser: on END");
//                if (fnc) {
//                    // return the user's result (result.id)
//                    exports.findUser(name, opw, fnc);
//                }
//                fnc = undefined;
//            }).on('error', function(err) {
//                trace("addUser: ERROR %j", err);
//                if (fnc) fnc();
//            });
//    }
    if (userCollection) {
        userCollection.insert({uname:name, upw:epw, auth: 1}, function(err, result) {
            if (err) console.log("addUser: insert error: %j", err);
            if (result && result[0] && result[0]._id) {
                var id = result[0]._id;
                // try to log them in (which will return the correct json)
                exports.findUser(name, opw, fnc);
            } else {
                if (fnc) fnc();
            }
        });
    }
};

exports.dumpAllUsers = function() {
    if (theClient) {
        console.log("_handle="+theClient.connection.stream._handle);
        console.log("destroyed="+theClient.connection.stream.destroyed);
//        console.log("theClient: v v v v v v v v v v v v v v v v v v v v");
//        console.log(theClient);
        var n = 0;
        var query = getClient().query('SELECT * FROM users LIMIT 3');
        query.on('row', function(row) {
            n++;
            console.log(""+n+": %j", row);
        }).on('error', function(err) {
            console.log("dumpAllUsers: ERROR %j", err);
        }).on('end', function() {
            console.log("dumpAllUsers: END");
        });
    }
    if (userCollection) {
        var cur = userCollection.find({}).limit(100);
        if (cur && cur.hasNext()) {
            result = cur.next();
            console.log(result);
        }
    }
};

// set the authorization-level for a given username
exports.setAuth = function(name, auth, fnc) {
    trace("setAuth: u="+name+"  new auth="+auth);
    if (theClient) {
        var query = getClient().query('UPDATE users SET auth=$1 WHERE uname=$2', [auth,name]);
        query.on('end', function() {
                // user inserted OK
                trace("setAuth: on END");
                if (fnc) {
                    fnc(true);
                }
            }).on('error', function(err) {
                trace("setAuth: ERROR %j", err);
                if (fnc) {
                    fnc();
                    fnc = undefined;
                }
            });
    } else {
        if (fnc) {
            fnc();
            fnc = undefined;
        }
    }
    if (userCollection) {

    }
};



exports.onReady = function(fnc) {
    if (exports.isReady()) {
        process.nextTick(fnc);
    } else {
        onReadyFncs.push(fnc);
    }
};

// allow testing of the encrypt function
exports.testencryptPW = encryptPW;
exports.testTheClient = theClient;