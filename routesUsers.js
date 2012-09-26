// routesUsers.js
//  handle all routes related to the "users" collection
//  Note: this collection is the actual collection of real users
//  Note: most access to this collection is restricted to authorized users only
//
//  /users                   -> all users
//  /users/:id               -> ONE user
var helper = require('./routesHelper');
var utdb = require('./utdb');
var collName = "users";

// check if user is logged in AND has special authoriziation to the entire users collection
var checkAuth = function(req, res) {
    if (helper.isAuth(req, 0x08)) {
        return true;
    } else {
        // not authorized
        res.send(401);
    }
};

// GET list of many/all users
exports.getUsers = function(req, res) {
    if (checkAuth(req, res)) {
        var options = helper.makeOptions(req);
        utdb.getDocs(utdb.collection_users(), collName, options, function(docs) {
            if (docs) {
                helper.sendJson(res, docs);
            } else {
                res.send(404);
            }
        });
    }
};
// create a new user
exports.postUsers = function(req,res) {
    // get username
    // get password
    // create new user
};

// GET one user info
exports.getUsers_id = function(req, res) {
    var myid = helper.getUserId(req);       // current logged-in user (ok to return the user info for themselves)
    var id = req.params.id;
    if (myid === id || checkAuth(req, res)) {
        if (id) {
            var options = helper.makeOptions(req);
            if (!options.query) options.query = {};
            options.query._id = id;
            utdb.getDocs(utdb.collection_users(), collName, options, function(docs) {
                if (docs && docs.length === 1) {
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
exports.putUsers_id = function(req, res) {
    var myid = helper.getUserId(req);
    var id = req.params.id;
    if (checkAuth(req, res)) {
        var doc = helper.getParam(req, "doc");
        if (id && doc && myid) {
            // update the exact document
            var options = {query:{_id:id}};
            utdb.putDoc(utdb.collection_users(), collName, options, doc, function(ok) {
                if (ok) {
                    helper.sendJson(res, {response:true, message:"putUsers OK"});
                } else {
                    res.send(404);
                }
            });
        } else {
            res.send(404);
        }
    }
};
exports.deleteUsers_id = function(req, res) {
    if (checkAuth(req, res)) {
        var id = req.params.id;
        if (id) {
            // delete the exact document
            var options = {query:{_id:id}};
            utdb.deleteDoc(utdb.collection_bots(), collName, options, function(ok) {
                if (ok) {
                    helper.sendJson(res, {response:true, message:"deleteUsers OK"});
                } else {
                    res.send(404);
                }
            });
        } else {
            res.send(404);
        }
    }
};
