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

var cleanseBot = function(req, bot, myid) {
    if (!myid || bot.user_id !== myid) {
        // this is NOT my bot ... remove fields I can't see (like their code)
        bot.code = undefined;
        return bot;
    }
    return bot;
};
var cleanseBots = function(req, bots, myid) {
    if (bots) {
        var returnBots = [];
        for(var i=0; i<bots.length; i++) {
            var bot = cleanseBot(req, bots[i], myid);
            if (bot) returnBots.push(bot);
        }
        return returnBots;
    }
    return bots;
};

var checkAuth = function(req, res, auth) {
    if (!auth) auth = 1;
    if (helper.isAuth(req, auth)) {
        return true;
    } else {
        // not authorized
        res.send(401);
    }
};

// GET /apis/:version/bots ? fields=id,name & query=name:Dan & limit=3 & offset=10
exports.getBots = function(req, res) {
    if (checkAuth(req, res)) {
        var options = helper.makeOptions(req);
        utdb.getDocs(utdb.collection_bots(), collName, options, function(docs) {
            if (docs) {
                docs = cleanseBots(req, docs);      // cleanse the list of bots (remove info current user can't see, like user code)
                helper.sendJson(res, docs);         // return the cleansed list
            } else {
                res.send(404);
            }
        });
    }
};
exports.postBots = function(req,res) {
    if (checkAuth(req, res)) {
        var doc = helper.getParam(req, "doc");
        if (!doc) {
            // error .. didn't pass in a document to store as a bot
            res.send(404);
        } else {
            // unless special auth, force the logged-in user_id into the doc
            doc.user_id = helper.getUserId(req);
//            console.log("POST bot doc: %j", doc);
            utdb.postDocs(utdb.collection_bots(), collName, doc, function(ok) {
                if (ok) {
                    helper.sendJson(res, {response:true, message:"postBots OK"});
                } else {
                    // error creating a new contest
                    res.send(404);
                }
            });
        }
    }
};


// GET /apis/:version/bots/:id
exports.getBots_id = function(req, res) {
    if (checkAuth(req, res)) {
        var id = req.params.id;
        if (id) {
            var options = helper.makeOptions(req);
            if (!options.query) options.query = {};
            options.query._id = id;
            utdb.getDocs(utdb.collection_bots(), collName, options, function(docs) {
                if (docs && docs.length === 1) {
                    var myid = helper.getUserId(req);       // current logged-in user (ok to return code for one of thier bots)
                    docs = cleanseBots(req, docs, myid);    // cleanse the list of bots (remove info current user can't see, like user code)
                    helper.sendJson(res, docs);
                } else {
                    res.send(404);
                }
            });
        } else {
            res.send(404);
        }
    }
};
exports.putBots_id = function(req, res) {
    if (checkAuth(req, res)) {
        var id = req.params.id;
        var doc = helper.getParam(req, "doc");
        var userid = helper.getUserId(req);
        if (id && doc && userid) {
            // update the exact document IFF is owned by current user
            var options = {query:{_id:id, user_id:userid}};
            doc.user_id = userid;
            utdb.putDoc(utdb.collection_bots(), collName, options, doc, function(ok) {
                if (ok) {
                    helper.sendJson(res, {response:true, message:"putBots OK"});
                } else {
                    res.send(404);
                }
            });
        } else {
            res.send(404);
        }
    }
};
exports.deleteBots_id = function(req, res) {
    if (checkAuth(req, res)) {
        var id = req.params.id;
        if (id) {
            var userid = helper.getUserId(req);
            var options;
            if(checkAuth(req, res, 0x10)) {
                // delete the exact document (no matter who owns it)
                options = {query:{_id:id}};
            } else {
                // delete the exact document IFF is owned by current user
                options = {query:{_id:id, user_id:userid}};
            }
            utdb.deleteDoc(utdb.collection_bots(), collName, options, function(ok) {
                if (ok) {
                    helper.sendJson(res, {response:true, message:"deleteBots OK"});
                } else {
                    res.send(404);
                }
            });
        } else {
            res.send(404);
        }
    }
};
