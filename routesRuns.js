// routesRuns.js
//  handle all routes related to the "runs" collection
//  a "run" is a single contest played with 2 (or more) bots
//      _id
//      contest_id  = "123abcd76500002"
//      bots_id     = [ ID_BOT1, ID_BOT2 ... ]
//      users_id    = [ ID_USER1,ID_USER2 ... ]
//      logs        = [ { log from bot 1 }, { log from bot 2 } ... ]
//
//  /runs                   -> all runs
//  /runs/:id               -> ONE run (has more detail than "all runs".  has more details if you are one of the users involved in the "run")
var helper = require('./routesHelper');
var utdb = require('./utdb');
var contest = require('./contest');
var collName = "runs";

var cleanseRun = function(req, run, myid) {
    // remove several pieces of info
    if (run && run.logs && run.users_id) {
        var botN = -1;
        var i;
        for(i=0; i<run.users_id.length; i++) {
            var uid = run.users_id[i];
            if (uid === myid) {
                // the current logged-in-user played in this run as Bot#<botN>
                botN = i;
                break;
            }
        }
        // remove logs that current user doesn't own
        for(i=0; i<run.users_id.length; i++) {
            if (i !== botN) {
                run.logs[i] = [];       // return an empty log array for non-me bots
            }
        }
    }
    return run;
};
var cleanseRuns = function(req, runs, myid) {
    if (runs) {
        var returnRuns = [];
        for(var i=0; i<runs.length; i++) {
            var run = cleanseRun(req, runs[i], myid);
            if (run) returnRuns.push(run);
        }
        return returnRuns;
    }
    return runs;
};

// Note: must be logged in to see any "runs" data
var checkAuth = function(req, res, auth) {
    if (!auth) auth = 1;
    if (helper.isAuth(req, auth)) {
        return true;
    } else {
        // not authorized
        res.send(401);
    }
};

// GET /apis/:version/runs ? fields=id,name & query=name:Dan & limit=3 & offset=10
exports.getRuns = function(req, res) {
    if (checkAuth(req, res)) {
        var options = helper.makeOptions(req);
        utdb.getDocs(utdb.collection_runs(), collName, options, function(docs) {
            if (docs) {
                docs = cleanseRuns(req, docs);      // cleanse the list of runs (remove info current user can't see, like pther users logs)
                helper.sendJson(res, docs);         // return the cleansed list
            } else {
                res.send(404);
            }
        });
    }
};
exports.postRuns = function(req,res) {
    if (checkAuth(req, res)) {
        var jsonError = {response:false, message:"Starting a contest is complex.  ?contest_id=1234abc0001&bot1_id=123a&bot2_id=123b"};
        var contest_id = helper.getParam(req, "contest_id");        // contest
        var bot1_id = helper.getParam(req, "bot1_id");              // bot1
        var bot2_id = helper.getParam(req, "bot2_id");              // bot2
        var user1_id = undefined;
        var user2_id = undefined;
        var contestDoc = undefined;
        var bot1Doc = undefined;
        var bot2Doc = undefined;

        var options = {};
        options.query = {};
        options.query._id = contest_id;
        utdb.getDocs(utdb.collection_contests(), "contests", options, function(docs) {
            if (docs && docs.length === 1) {
                // contest requested found
                var contestDoc = docs[0];
                var options = {};
                options.query = {};
                options.query._id = bot1_id;
                utdb.getDocs(utdb.collection_bots(), "bots", options, function(docs) {
                    if (docs && docs.length === 1) {
                        // bot requested found
                        var bot1Doc = docs[0];
                        user1_id = bot1Doc.user_id;
                        var options = {};
                        options.query = {};
                        options.query._id = bot2_id;
                        utdb.getDocs(utdb.collection_bots(), "bots", options, function(docs) {
                            if (docs && docs.length === 1) {
                                // bot requested found
                                var bot2Doc = docs[0];
                                user2_id = bot1Doc.user_id;

                                // @TODO: work here ...
                                var myid = helper.getUserId(req);
                                var doc = {};
                                doc.contest_id = contest_id;
                                doc.bots_id = [];
                                doc.bots_id[0] = bot1_id;
                                doc.bots_id[1] = bot2_id;
                                doc.users_id = [];
                                doc.users_id[0] = user1_id;
                                doc.users_id[1] = user2_id;
                                doc.logs = [];
                                doc.logs[0] = ["first log for player 1"];
                                doc.logs[1] = ["first log for player 2"];
                                if (contest.queueContestToStart(doc)) {
                                    helper.sendJson(res, {response:true, message:"Contest started"});
                                } else {
                                    helper.sendJson(res, {response:false, message:"Contest NOT started"});
                                }
                            } else {
                                jsonError.missing="bot2_id";
                                helper.sendJson(res, jsonError);
                            }
                        });
                    } else {
                        jsonError.missing="bot1_id";
                        helper.sendJson(res, jsonError);
                    }
                });
            } else {
                jsonError.missing="contest_id";
                helper.sendJson(res, jsonError);
            }
        });

//        var doc = helper.getParam(req, "doc");
//        if (!doc) {
//            // error .. didn't pass in a document to store as a bot
//            res.send(404);
//        } else {
//            // unless special auth, force the logged-in user_id into the doc
//            doc.user_id = helper.getUserId(req);
//            utdb.postDocs(utdb.collection_runs(), collName, doc, function(ok) {
//                if (ok) {
//                    helper.sendJson(res, {response:true, message:"postBots OK"});
//                } else {
//                    // error creating a new contest
//                    res.send(404);
//                }
//            });
//        }
    }
};


// GET /apis/:version/runs/:id
exports.getRuns_id = function(req, res) {
    if (checkAuth(req, res)) {
        var id = req.params.id;
        if (id) {
            var options = helper.makeOptions(req);
            if (!options.query) options.query = {};
            options.query._id = id;
            utdb.getDocs(utdb.collection_runs(), collName, options, function(docs) {
                if (docs && docs.length === 1) {
                    var myid = helper.getUserId(req);       // current logged-in user (ok to return extra info for them)
                    docs = cleanseRuns(req, docs, myid);    // cleanse the list of runs (remove info current user can't see, like logs)
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
