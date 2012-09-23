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

var getContests = function() {
    return [{id:"123a6", name:"RockPaperScissors", description:"Rock Paper Scissors"}, {id:"528f1", name:"Contest 2", description:"Something goes here"}];
};

// GET /apis/:version/contests ? fields=id,name & query=name:Dan & limit=3 & offset=10
exports.getContests = function(req, res) {
//    if (!helper.showDocs(req,res, {
//        version: 1,
//        api: "contests",
//        method: "GET",
//        description: "get a collection of contests",
//        urlparams: [
//        ],
//        params: [
//            "fields --- limit fields returned"
//        ],
//        longDesc: "get a collection"
//    })) {
//        var coll = getContests();
//        coll = helper.cleanCollection(req, coll);
//        helper.sendJson(res, coll);
//    }
    var options = helper.makeOptions(req);
    utdb.getContests(options, function(docs) {
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
            var doc = helper.getParam(res, "doc");
            if (!doc) {
                // error .. didn't pass in a document to store as a contest
                res.send(404);
            } else {
                utdb.postContests(doc, function(ok) {
                    if (ok) {
                        helper.sendJson(res, {});
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
//    var id = req.params.id;
//    var list = getContests();
//    var item;
//    for(var i=0; i<list.length; i++) {
//        item = list[i];
//        if (item.id === id) {
//            helper.sendJson(res, helper.cleanItem(req, item));
//            return;
//        }
//    }
//    res.send(404);
    var id = req.params.id;
    console.log("getContests_id="+id);
    if (id) {
        var options = helper.makeOptions(req);
        if (!options.query) options.query = {};
        options.query._id = id;
        console.log(options);
        utdb.getContests(options, function(docs) {
            if (docs && docs.length === 1) {
                helper.sendJson(res, docs);
            } else {
                res.send(404);
            }
        });
    }
    res.send(404);
};
exports.putContests_id = function(req, res) {
    var id = req.params.id;
    if (id) {
        utdb.putContests({query:{_id:id}}, doc, function(ok) {
            if (ok) {
                helper.sendJson(res, {});
            } else {
                res.send(404);
            }
        });
    }
    res.send(404);
};
