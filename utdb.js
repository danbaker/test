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
            04   = can alter the "contests" collection
            08   = can view/manage the "users" collection (highly dangerous)
            10   = can manage the entire "bots" collection (can delete bots that you don't own)
            20   = can manage the entire "logs" collection (like delete the entire collection)
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
var BSON;
if (!isLocal) {
    mongo = require('mongodb');
    BSON = mongo.BSONPure;
}


// * * * * * * * * * * * * * * * *
var botsCollection;             // the "bots" collection (each bot is related to a user and a contest)
//var codeCollection;             // the "code" collection (each code-document is related to a user-id)
var contestsCollection;         // the "contests" collection
var userCollection;             // the "users" collection
var runsCollection;             // the "runs" collection (each contest has several "runs" between two bots on that contest)
var logsCollection;             // the "logs" collection (each "run" has many logs for each bot)


var theClient = undefined;              // the database-client-connection object
var onReadyFncs = [];


// function to call to NOT log message to console
var nillFunction = function() {
};
var trace;
//trace = console.log;                // report all trace messages to console
trace = nillFunction;             // ignore all trace messages

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

        db.createCollection('contests', function(err, collection) {
            if (err) console.log("createCollection code error: %j", err);
            db.collection('contests', function(err, collection) {
                if (err) console.log("collection code error: %j", err);
                contestsCollection = collection;
            });
        });

        db.createCollection('bots', function(err, collection) {
            if (err) console.log("createCollection code error: %j", err);
            db.collection('bots', function(err, collection) {
                if (err) console.log("collection code error: %j", err);
                botsCollection = collection;
            });
        });

        db.createCollection('runs', function(err, collection) {
            if (err) console.log("createCollection code error: %j", err);
            db.collection('runs', function(err, collection) {
                if (err) console.log("collection code error: %j", err);
                runsCollection = collection;
            });
        });

        db.createCollection('logs', function(err, collection) {
            if (err) console.log("createCollection code error: %j", err);
            db.collection('logs', function(err, collection) {
                if (err) console.log("collection code error: %j", err);
                logsCollection = collection;
            });
        });

        // create other collections here ...
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

// get a document from the "users" collection
// in:  obj     = {uname:Dan}  --or--  {uname:Dan, upw:1ab50f2}
// out: undefined
//      {uname:Dan, id:156ffe3, auth:7}
var getUserDoc = function(obj, fnc) {
    if (isLocal) {
        process.nextTick(function() {
            fnc({uname:"LocalDan", id:"111", auth:255});
        });
    } else {
        if (userCollection && obj && fnc) {
            userCollection.find(obj, function(err, result) {
                if (err || !result) {
                    // error
                    fnc(undefined);
                } else {
                    result.nextObject(function(err, user) {
                        if (user) {
                            // FOUND
                            var obj = {uname:user.uname, id:user._id, _id:user._id, auth:user.auth};
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

// find a user in the user table (given username AND password)
// used for logging in
exports.findUser = function(name, opw, fnc) {
    if (name && opw && fnc) {
        var epw = encryptPW(opw, name);
        getUserDoc({uname:name, upw:epw}, function(doc) {
            if (!doc) {
                fnc(undefined);
            } else {
                fnc(doc);
            }
        });
    } else {
        fnc(undefined);
    }
};

// get the id for a given username
// used for internal use (battling two users in a contest)
exports.getIdForUsername = function(name, fnc) {
    getUserDoc({uname:name}, function(doc) {
        if (!doc) {
            fnc(undefined);
        } else {
            fnc(doc.id);
        }
    });
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
// *            collections
// *
exports.collection_bots = function() { return botsCollection; };
exports.collection_contests = function() { return contestsCollection; };
exports.collection_logs = function() { return logsCollection; };
exports.collection_runs = function() { return runsCollection; };
exports.collection_users = function() { return userCollection; };


exports.getDocs = function(coll, collName, options, fnc) {
    get_collection(coll, options, fnc, "get"+collName);
};
exports.postDocs = function(coll, collName, doc, fnc) {
    post_collection(coll, doc, fnc, "post"+collName);
};
exports.putDoc = function(coll, collName, options, doc, fnc) {
    put_collection(coll, options, doc, fnc, "put"+collName);
};
exports.deleteDoc = function(coll, collName, options, fnc) {
    delete_collection(coll, options, fnc, "delete"+collName);
};
exports.getDoc = function(coll, collName, id, fnc, options) {
    options = options || {};
    if (id) {
        if (!options.query) options.query = {};
        options.query._id = id;
        exports.getDocs(coll, collName, options, function(docs) {
            if (docs && docs.length === 1) {
                fnc(docs[0]);
            } else {
                fnc(undefined);
            }
        });
    } else {
        fnc(undefined);
    }
};
exports.updateDoc = function(coll, collName, id, fncUpdateDoc, fncDone) {
    updateDoc_collection(coll, id, fncUpdateDoc, fncDone, collName);
};


// * * * * * * * * * * * * * * * * * * * * * * * * *
// *
// *            general collection handling
// *

var getQueryOption = function(options) {
    var query = options.query || {};        // select query:  { name:"Dan" } means "select documents where name = "Dan"
    if (query) {
        for(var key in query){
            if (query.hasOwnProperty(key)) {
                // if the key IS "_id" then convert it into a MongoDB "id"
                // Note: ONLY the _id field needs altered.  Not if it is copied into other docs as "contest_id"
                if (key === "_id") {
                    try {
                        query[key] = new BSON.ObjectID(query[key]);
                    } catch (e) {
                        console.log("_id error: %j", e)
                    }
                }
            }
        }
    }
    return query;
};

// get a set of items from a collection
// in:  coll    = the collection
//      options =   { fields: { id:true, name:true }        // return fields:  id, name
//                    query:  { name:"Dan" }                // find documents that match name="Dan
//                    limit:  50                            // return, at most, N records
//                    offset: 100                           // skip the first N records
//                  }
//      fnc     = callback([...found docs...]) --or-- callback(undefined)
//      msgName = the name of the method that was called (used in error messages)
var get_collection = function(coll, options, fnc, msgName) {
    if (coll && fnc) {
        var found = [];
        var fields = options.fields || {};      // specific fields to return:  {id:true, name:true}
        var query = getQueryOption(options);    // select query:  { name:"Dan" } means "select documents where name = "Dan"
        coll.find(query, fields, function(err, cursor) {
            if (err || !cursor) {
                if (err) console.log(""+msgName+": find error: %j", err);
                // error
                fnc();
            } else {
                if (options.limit) cursor.limit(options.limit);         // options.limit = 100
                if (options.offset) cursor.skip(options.offset);        // options.offset = 50
//                if (options.sort) cursor.sort(options.sort);            // options.sort = {lastname:1, firstname:1}
                console.log("=== get_collection sort=%j",options.sort);
                cursor.sort([["logNumber"]]);
                cursor.each(function(err, item) {
                    //console.log("= = = get_collection("+msgName+"): item=%j",item);
                    if(!item) {
                        fnc(found);
                    } else {
                        found.push(item);
                    }
                });
            }
        });
    } else if (fnc) {
        // no collection opened
        console.log(""+msgName+": error: collection not opened");
        fnc();
    }
};

// post a new item to a collection
// in:  coll    = the collection
//      doc     = { ... } the document to insert into the collection
//      fnc     = callback(result_object) --or-- callback(undefined)
//      msgName = the name of the method that was called (used in error messages)
var post_collection = function(coll, doc, fnc, msgName) {
    if (coll && fnc) {
        coll.insert(doc, function(err, result) {
            if (err) console.log(""+msgName+": insert error: %j", err);
            if (result) {
                fnc(result);
            } else {
                fnc();
            }
        });
    } else if (fnc) {
        // no collection opened
        console.log(""+msgName+": error: collection not opened");
        fnc();
    }
};

// put an updated item into a collection
// in:  coll    = the collection
//      options =   { fields: { id:true, name:true }        // limit fields to get:  id, name
//                    query:  { name:"Dan" }                // find the document that match name="Dan"
//                    insert: true                          // true means to insert the doc, even if doc doesn't already exist
//                  }
var put_collection = function(coll, options, doc, fnc, msgName) {
    console.log("put_collection .. getting first");
    get_collection(coll, {fields:options.fields, query:options.query, limit:2}, function(docs) {
        console.log("get_collection returned");
        if (!docs) {
            // error: failed
            if (options.insert) {
                // @TODO: maybe post here ...
            }
            console.log("docs returns undefined");
            fnc();
        } else if (docs.length != 1) {
            // error ... didn't get exactly 1 document
            console.log("docs returned: "+docs.length+" docs");
            fnc();
        } else {
            // found the document to update
            console.log("got 1 document ... PUT new doc");
            var d = docs[0];
            doc._id = d._id;
            coll.save(doc);
            fnc(true);

        }
    }, msgName);
};

// delete a set of items from a collection
// in:  coll    = the collection
//      options =   {
//                    query:  { name:"Dan" }                // find documents that match name="Dan"
//                  }
//      fnc     = callback(cnt_removed) --or-- callback(undefined)
//      msgName = the name of the method that was called (used in error messages)
var delete_collection = function(coll, options, fnc, msgName) {
    var query = getQueryOption(options);            // select query:  { name:"Dan" } means "select documents where name = "Dan"
    coll.remove(query, function(err, removed) {
        if (err) {
            console.log("delete_collection ERROR: %j", err);
                fnc(undefined);
        } else {
            // @TODO: determine how to KNOW that the delete happened ... "removed" seems to come back undefined
            console.log("delete_collection OK: %j", removed);
            fnc(true);
        }
    });
};

// update a single already-existing document in a collection
// in:  coll            = the collection
//      id              = the _id of the doc to update
//      fncUpdateDoc    = fnc(docToUpdate, fnc) -- callback after found the doc to be updated (calls "fnc" with doc when done)
//      fncDone         = fnc(ok) -- callback after the altered-document has been written back to database collection
//      msgName         = the name of the collection ("contests")
var updateDoc_collection = function(coll, id, fncUpdateDoc, fncDone, msgName) {
    if (coll && msgName && id && fncUpdateDoc) {
        var options = {};
        options.query = {_id:id};
        options.limit = 2;
        get_collection(coll, options, function(docs) {
            if (!docs) {
                // failed to find request doc _id
                fncDone();
            } else if (docs.length != 1) {
                // error ... didn't get exactly 1 document
                fncDone();
            } else {
                // found the document to update
                var d = docs[0];
                fncUpdateDoc(d, function(doc) {
                    coll.save(doc, function(err, result) {
                        if (err) {
                            fncDone();
                        } else {
                            fncDone(result);
                        }
                    });
                });
            }
        }, msgName);
    } else {
        fncDone();
    }
};


// * * * * * * * * * * * * * * * * * * * * * * * * *
// *

// add another function to be called with the database is ready to use
exports.onReady = function(fnc) {
    if (exports.isReady()) {
        process.nextTick(fnc);
    } else {
        onReadyFncs.push(fnc);
    }
};
// public function to check if running a debug-local version
exports.isLocal = function() {
    return isLocal;
};

// allow testing of the encrypt function
exports.testencryptPW = encryptPW;
exports.testTheClient = theClient;