var mdbURL = process.env.MONGOLAB_URI;   // URL to THE database
var isLocal = (mdbURL? false : true);
var mongo;

if (!isLocal) {

    mongo = require('mongodb');
    var nillFunction = function() {
    };
    var trace;
    //trace = console.log;                // report all trace messages to console
    trace = nillFunction;             // ignore all trace messages

    var logsCollection;             // the "logs" collection (each "run" has many logs for each bot)

    mongo.connect(mdbURL, {}, function(error, db) {
        trace("...connected to MongoLabs");

        db.addListener("error", function(error){
            console.log("Error connecting to MongoLab: %j", error);
        });

        // create each collection

        db.createCollection('logs', function(err, collection) {
            if (err) console.log("createCollection code error: %j", err);
            db.collection('logs', function(err, collection) {
                if (err) console.log("collection code error: %j", err);
                logsCollection = collection;
            });
        });
    });

    // post a new item to a collection
    // in:  coll    = the collection
    //      doc     = { ... } the document to insert into the collection
    //      msgName = the name of the method that was called (used in error messages)
    var savedLogs = [];
    exports.postLogs = function(doc) {
        if (!exports.isLogReady()) {
            if (!savedLogs) savedLogs = [];
            savedLogs.push(doc);
        } else {
            if (savedLogs) {
                for(var i=0; i<savedLogs.length; i++) {
                    postOneLog(savedLogs[i]);
                }
                savedLogs = null;
            }
            postOneLog(doc);
        }
    };

    var postOneLog = function(doc, fnc) {
        if (logsCollection) {
            logsCollection.insert(doc, function(err, result) {
            });
        }
    };

    exports.isLogReady = function() {
        return !!logsCollection;
    };

} else {
    exports.postLogs =  function() {};
}

