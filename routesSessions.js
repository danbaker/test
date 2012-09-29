// routesSessions
//  handle routes related to "sessions"
var helper = require('./routesHelper');
var utdb = require('./utdb');



// FUNCTION: perform login of user (set the session object to be logged in)
var doLogin = function(req, res, result) {
    // create a new, empty, "user" object in the session
    if (utdb.isLocal()) {
        // assume we have already created the login session info ... since "local testing"
    } else {
        var username = helper.getParam('username');
        var uobj = {};
        uobj.name = username;                   // username the user supplied
        uobj.id = result.id;                    // id of the logged in user
        uobj._id = result._id;
        uobj.auth = result.auth | 1;            // authorization level for the logged in user (ensure logged-in)
        // save this newly created user object in the session
        req.session.user = uobj;
    }
};

// return an object describing the current-logged-in-user
var returnLoginInfo = function(req, res, msg) {
    var uobj = req.session.user;
    helper.sendJson(res, {response:true, id: uobj.id, auth: uobj.auth, name: uobj.uname, message:msg});
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
//  GET -- check if logged in

exports.getSessions = function(req, res) {
    if (!helper.showDocs(req,res, {
        version: 1,
        method: "GET",
        api: "sessions",
        description: "check if logged in",
        urlparams: [
        ],
        longDesc: "If you are not logged in, this will return a 404.<br>" +
            "If you are logged in, returns a json object that contains:<br>"+
            ".. auth = bit-fields (see setauth for meaning of each bit)<br>"+
            ".. name = the public screen-name this user is identified by<br>"+
            ""
    })) {
        if (helper.isAuth(req, 0x01)) {
            // IS logged in
            returnLoginInfo(req, res, "logged in");
        } else {
            // NOT logged in
            res.send(404);
        }
    }
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
//  POST -- login

exports.postSessions = function(req, res) {
    if (!helper.showDocs(req,res, {
        version: 1,
        method:"POST",
        api: "sessions",
        description: "login as a new user",
        urlparams: [
        ],
        params: [
            "username -- the user to login as",
            "password -- the cleartext password for this user"
        ],
        longDesc: "If your username is not valid or the password doesn't match, then the login will fail (404).<br>" +
            "Returns a json object that contains:<br>"+
            ".. auth = bit-fields (see setauth for meaning of each bit)<br>"+
            ".. name = the public screen-name this user is identified by<br>"+
            ""
    })) {
        // Note: anyone allowed to request to login
        // apis/<version>/login a username w/ password
        var username = helper.getParam(req, "username");
        var password = helper.getParam(req, "password");
        utdb.findUser(username, password, function(result) {
            if (!result) {
                // return "FAILED LOGIN"
                console.log("login "+username+" FAILED");
                res.send(404);
            } else {
                // return "LOGIN OK"
                // set result.id into the session
                doLogin(req, res, result);
                returnLoginInfo(req, res, "login ok");
            }
        });
    }
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
//  DELETE -- logout

exports.deleteSessions = function(req, res) {
    if (!helper.showDocs(req,res, {
        version: 1,
        method:"DELETE",
        api: "sessions",
        description: "logout the current user",
        urlparams: [
        ],
        params: [
        ],
        longDesc: "Logs the current user out.<br>" +
            "If no user is logged in, this call still succeeds.<br>"+
            ""
    })) {
        req.session.user = undefined;
        req.session.destroy();
        helper.sendJson(res, {response:true, message:"logout ok"});
    }
};
