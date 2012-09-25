// routesBots.js
//  handle all routes related to the "bots" collection
//
//  /bots                   -> all bots (you can only get/set code for your own bots)
//  /bots/:id               -> ONE bot
//  /bots/:id/plays         -> get all "plays" this bot has played
//  /bots/:id/plays/:id     -> get all "plays" this bot has played
var helper = require('./routesHelper');
var utdb = require('./utdb');
var collName = "bots";

// GET /apis/:version/bots ? fields=id,name & query=name:Dan & limit=3 & offset=10
exports.getBots = function(req, res) {
    var options = helper.makeOptions(req);
    utdb.getDocs(utdb.collection_bots(), collName, options, function(docs) {
        if (docs) {
            helper.sendJson(res, docs);
        } else {
            res.send(404);
        }
    });
};
exports.postBots = function(req,res) {
    if (!helper.showDocs(req,res, {
        version: 1,
        api: collName,
        method: "POST",
        description: "create a new bot",
        urlparams: [
        ],
        params: [
            "doc --- the entire document to add"
        ],
        longDesc: "get a collection"
    })) {
        if (helper.isAuth(req, 0x04)) {
            var doc = helper.getParam(req, "doc");
            doc = helper.parseToObject(doc);
            if (!doc) {
                // error .. didn't pass in a document to store as a contest
                res.send(404);
            } else {
                utdb.postDocs(utdb.collection_bots(), collName, doc, function(ok) {
                    if (ok) {
                        helper.sendJson(res, {response:true, message:"postBots OK"});
                    } else {
                        // error creating a new contest
                        res.send(404);
                    }
                });
            }
        } else {
            // not authorized
            res.send(404);
        }
    }
};


// GET /apis/:version/contests/:id
exports.getBots_id = function(req, res) {
    var id = req.params.id;
    if (id) {
        var options = helper.makeOptions(req);
        if (!options.query) options.query = {};
        options.query._id = id;
        utdb.getDocs(utdb.collection_bots(), collName, options, function(docs) {
            if (docs && docs.length === 1) {
                helper.sendJson(res, docs);
            } else {
                res.send(404);
            }
        });
    } else {
        res.send(404);
    }
};
exports.putBots_id = function(req, res) {
    var id = req.params.id;
    var doc = helper.getParam(req, "doc");
    doc = helper.parseToObject(doc);
    if (id && doc) {
        utdb.putDoc(utdb.collection_bots(), collName, {query:{_id:id}}, doc, function(ok) {
            if (ok) {
                helper.sendJson(res, {response:true, message:"putBots OK"});
            } else {
                res.send(404);
            }
        });
    } else {
        res.send(404);
    }
};
