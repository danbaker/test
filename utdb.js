/*
    COLLECTION:  users
        _id     // auto assigned hex string
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


    COLLECTION:  code
        _id         // auto assigned hex-string value
        users_id    // user that "owns" this code-document
        contest_id  // (FUTURE) which contest this code is for
        code        // the actual code (one big string)

 */
var mdbURL = process.env.MONGOLAB_URI;   // URL to THE database
var isLocal = (mdbURL? false : true);
var nhash = require('node_hash');
var pg;
var mongo;
if (!isLocal) {
//    pg = require('pg');
    mongo = require('mongodb');
}


// * * * * * * * * * * * * * * * *
var userCollection;             // the "users" collection
var codeCollection;             // the "code" collection (each code-document is related to a user-id)



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
            if (err) console.log("createCollection users error: %j", err);
            db.collection('users', function(err, collection) {
                if (err) console.log("collection users error: %j", err);
                userCollection = collection;
                // force the "username" to be unique (can't have two users with the same username)
                userCollection.ensureIndex({uname:1},{unique:true});
                doOnReadyNow();
            });
        });

        db.createCollection('code', function(err, collection) {
            if (err) console.log("createCollection code error: %j", err);
            db.collection('users', function(err, collection) {
                if (err) console.log("collection code error: %j", err);
                codeCollection = collection;
            });
        });

        // @TODO: create other collections here ...
    });
}


// * * * * * * * * * * * * * * * * * * * * * * * * *
// *
// *            users collection
// *


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
//getClient = function() {
//    if (theClient) {
//        if (theClient.connection && theClient.connection.stream && theClient.connection.stream.destroyed) {
//            console.log("utdb.getClient -- connection is destroyed");
//            // NOTE: Playing with this is confusing.  destroyed is set to true sometimes, but magically re-connects
////            theClient = undefined;
////            pg.connect(process.env.DATABASE_URL, function(err, client) {
////                if (err) {
////                    console.log("database connection error: "+err);
////                } else {
////                    theClient = client;
////                }
////            });
//        }
//    }
//    return theClient;
//};
//exports.getClient = getClient;

// find a user in the user table
exports.findUser = function(name, opw, fnc) {
    var pw = encryptPW(opw, name);
    trace("findUser u="+name+" pw="+pw);

    if (userCollection) {
        if (fnc) {
            userCollection.find({uname:name, upw:pw}, function(err, result) {
                if (err || !result) {
                    // error
                    fnc(undefined);
                } else {
                    result.nextObject(function(err, user) {
                        console.log("USER:");
                        console.log(user);
                        if (user) {
                            // FOUND
                            var obj = {uname:user.uname, id:user._id, auth:user.auth};
                            console.log("Returning found user: %j", obj);
                            fnc(obj);
                        } else {
                            // NOT FOUND
                            fnc(undefined);
                        }
                    });
                }
            });
        }
    }
};

// add a new user to the system
exports.addUser = function(name, opw, fnc) {
    var epw = encryptPW(opw, name);
    trace("addUser: u="+name+"  pw="+epw);
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
    if (userCollection) {
        var cur = userCollection.find({}).limit(100);
        cur.each(function(err,result) {
            console.log(result);
        });
    }
};

// set the authorization-level for a given username
exports.setAuth = function(name, auth, fnc) {
    trace("setAuth: u="+name+"  new auth="+auth);
    if (userCollection) {
        userCollection.find({uname:name}, function(err, result) {
            if (err || !result) {
                // error
                fnc();
            } else {
                result.nextObject(function(err, user) {
                    if (user) {
                        // FOUND
                        user.auth = auth;
                        userCollection.save(user);
                        fnc(true);
                    } else {
                        // user NOT FOUND
                        fnc();
                    }
                });
            }
        });
    }
};


// * * * * * * * * * * * * * * * * * * * * * * * * *
// *
// *            code collection
// *

// set the code-document for a given user (uid)
// in:  uid     = user-id
//      game-id = (FUTURE) game-id, which game the code is for
//      code    = the actual javascript code (string)
exports.setCode = function(uid, code, fnc) {
    if (codeCollection && fnc) {
        codeCollection.find({uid:uid}, function(err, result) {
            if (err || !result) {
                // error
                fnc();
            } else {
                result.nextObject(function(err, doc) {
                    if (doc) {
                        // FOUND existing code ... update it
                        console.log("saving code="+code);
                        doc.code = code;
                        codeCollection.save(doc);
                        fnc(true);
                    } else {
                        // code NOT FOUND ... insert it
                        codeCollection.insert({uid:uid, code:code}, function(err, result) {
                            if (err) console.log("setCode: insert error: %j", err);
                            if (result) {
                                fnc(true);
                            } else {
                                fnc();
                            }
                        });
                    }
                });
            }
        });
    }
};

// get the code-document for a given user
// in:  uid     = user-id
//      game-id = (FUTURE) game-id, which game the code is for
//      fnc     = callback(string) --or-- callback(undefined)
// out: code    = the actual javascript code (string)
exports.getCode = function(uid, fnc) {
    if (codeCollection && fnc) {
        codeCollection.find({uid:uid}, function(err, result) {
            if (err || !result) {
                if (err) console.log("getcode: error: %j", err);
                // error
                fnc();
            } else {
                result.nextObject(function(err, doc) {
                    if (doc) {
                        // FOUND existing code ... return it
                        console.log("getCode: code="+doc.code);
                        fnc(doc.code);
                    } else {
                        // code NOT FOUND ... return empty
                        fnc("");
                    }
                });
            }
        });
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