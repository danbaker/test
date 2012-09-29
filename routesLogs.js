// routesLogs.js
//  handle all routes related to the "logs" collection
var helper = require('./routesHelper');
var utdb = require('./utdb');
var collName = "logs";

// Note: must be logged in to see any "logs" data
var checkAuth = function(req, res, auth) {
    if (!auth) auth = 1;
    if (helper.isAuth(req, auth)) {
        return true;
    } else {
        // not authorized
        res.send(401);
    }
};

// GET /apis/:version/logs ? fields=id,name & query=name:Dan & limit=3 & offset=10
exports.getLogs = function(req, res) {
    if (checkAuth(req, res)) {
        var options = helper.makeOptions(req);
        utdb.getDocs(utdb.collection_runs(), collName, options, function(docs) {
            if (docs) {
//                docs = cleanseRuns(req, docs);      // cleanse the list of runs (remove info current user can't see, like pther users logs)
                helper.sendJson(res, docs);         // return the cleansed list
            } else {
                res.send(404);
            }
        });
    }
};


// GET /apis/:version/runs/:id
exports.getLogs_id = function(req, res) {
    if (checkAuth(req, res)) {
        var id = req.params.id;
        if (id) {
            var options = helper.makeOptions(req);
            if (!options.query) options.query = {};
            options.query._id = id;
            utdb.getDocs(utdb.collection_runs(), collName, options, function(docs) {
                if (docs && docs.length === 1) {
                    var myid = helper.getUserId(req);       // current logged-in user (ok to return extra info for them)
//                    docs = cleanseRuns(req, docs, myid);    // cleanse the list of runs (remove info current user can't see, like logs)
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
