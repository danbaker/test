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
    //      fnc     = callback(result_object) --or-- callback(undefined)
    //      msgName = the name of the method that was called (used in error messages)
    exports.postLogs = function(doc, fnc) {
        var coll = logsCollection;
        var msgName = "logs";
        if (coll) {
            coll.insert(doc, function(err, result) {
                if (fnc) {
                    if (result) {
                        fnc(result);
                    } else {
                        fnc();
                    }
                }
            });
        } else if (fnc) {
            // no collection opened
            fnc();
        }
    };


} else {
    exports.postLogs =  function() {};
}

