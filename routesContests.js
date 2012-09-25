// routesContests.js
//  handle all routes related to the "contests" collection
//
//  /contests                           -> all contests
//  /contests/:id                       -> ONE contest info
//  /contests/:id/bots                  -> ALL bots for a contest
//  /contests/:id/bots/:id              -> ONE bot info
//  /contests/:id/bots/:id/plays        -> get all "plays" this bot has played
//  /contests/:id/bots/:id/plays/:id    -> get all "plays" this bot has played
var helper = require('./routesHelper');
var utdb = require('./utdb');

// GET /apis/:version/contests ? fields=id,name & query=name:Dan & limit=3 & offset=10
exports.getContests = function(req, res) {
    var options = helper.makeOptions(req);
    utdb.getDocs(utdb.collection_contests(), "contests", options, function(docs) {
        if (docs) {
            helper.sendJson(res, docs);
        } else {
            res.send(404);
        }
    });
};
exports.postContests = function(req,res) {
    if (!helper.showDocs(req,res, {
        version: 1,
        api: "contests",
        method: "POST",
        description: "create a new contest",
        urlparams: [
        ],
        params: [
            "doc --- the entire document to add as a contest"
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
                utdb.postDocs(utdb.collection_contests(), "contests", doc, function(ok) {
                    if (ok) {
                        helper.sendJson(res, {response:true, message:"postContests OK"});
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
exports.getContests_id = function(req, res) {
    var id = req.params.id;
    if (id) {
        var options = helper.makeOptions(req);
        if (!options.query) options.query = {};
        options.query._id = id;
        utdb.getDocs(utdb.collection_contests(), "contests", options, function(docs) {
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
exports.putContests_id = function(req, res) {
    var id = req.params.id;
    var doc = helper.getParam(req, "doc");
    doc = helper.parseToObject(doc);
    if (id && doc) {
        utdb.putDoc(utdb.collection_contests(), "contests", {query:{_id:id}}, doc, function(ok) {
            if (ok) {
                helper.sendJson(res, {response:true, message:"putContests OK"});
            } else {
                res.send(404);
            }
        });
    } else {
        res.send(404);
    }
};
