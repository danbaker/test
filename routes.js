/*
    ROUTES:

    /apis/<api-version-number>/<api-name>/<arguments...>
    /apis/1/status                              // show the system status in the heroku logs
    /apis/1/createuser/<username>/<password>    // create a new user w/ username and password
    /apis/1/login/<username>/<password>         // login an existing user w/ username and password
    /apis/1/logout                              // logout currently logged in user (deletes session state)
    /apis/1/setauth/<username>/<auth>           // set the authorization value for user (requires an auth level)
 */


module.exports = function(app){

    var utdb = require('./utdb');

    // HELPER: send JSON to client
    var sendJson = function(res, json) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(json));
    };
    // FUNCTION: perform login of user
    var doLogin = function(req, res, result, msg) {
        // create a new, empty, "user" object in the session
        var uobj = {};
        uobj.name = req.params.username;        // username the user supplied
        uobj.id = result.id;                    // id of the logged in user
        uobj.auth = result.auth | 1;            // authorization level for the logged in user (ensure logged-in)
        // save this newly created user object in the session
        req.session.user = uobj;

        sendJson(res, {response:true, auth: uobj.auth, message:msg});        // return "logged in OK" or "created user OK"
    };
    // check if the user is logged in for a given request
    var isLoggedIn = function(req) {
        if (req && req.session && req.session.user && req.session.user.auth) {
            return true;
        }
    };
    // check if the user is authorized for a given action ("n" is a bit -- see utdb.js)
    var isAuth = function(req, n) {
        if (req && req.session && req.session.user)
            return req.session.user.auth & n;               // 1, 2, 4, 8 ...  (see utdb.js)
        return false;
    };
    // check if user requested docs -- return docs (and return "true"
    var showDocs = function(req,res,docs) {
        if (req && req.query && (req.query["docs"] || req.query["doc"])) {
            var i;
            var msg = "";
            msg += "Documentation for request: "+req.url+"<br>";
            msg += ".. usage: /apis/"+docs.version+"/"+docs.api;
            if (docs.params) {
                for(i=0; i<docs.params.length; i++) {
                    msg += "/"+docs.params[i].substr(0,docs.params[i].indexOf(" "));
                }
            }
            msg += "<br>";
            msg += ".. api "+docs.api+"<br>";
            msg += ".. version "+docs.version+"<br>";
            msg += ".. "+docs.description+"<br>";
            if (docs.params) {
                msg += ".. URL parameters:<br>"
                for(i=0; i<docs.params.length; i++) {
                    msg += ".. .. "+i+": "+docs.params[i]+"<br>";
                }
            }
            msg += "<br><br>" + docs.longDesc;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(msg);
            return true;
        }
        return false;
    };



    // setup express to allow for parameter validation via a regex
    app.param(function(name, fn){
        if (fn instanceof RegExp) {
            return function(req, res, next, val){
                var captures;
                if (captures = fn.exec(String(val))) {
                    req.params[name] = captures;
                    next();
                } else {
                    next('route');
                }
            }
        }
    });
    // validate some parameters
    app.param('version', /^\d+$/);          // API version#


    // define routes

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/:version/status', function(req, res) {
        // Note: anyone allowed to ask for status
        console.log("STATUS: %j", req.session);
        sendJson(res, {response:true, message:"status ok"});//, theClient:utdb.testTheClient});
        utdb.dumpAllUsers();
    });

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/:version/createuser/:username/:password', function(req, res) {
        if (!showDocs(req,res, {
            version: 1,
            api: "createuser",
            description: "create a new user with initial password",
            params: [
                "username -- the user to create",
                "password -- the cleartext password to be their password"
            ],
            longDesc: "If your username already exists, you will get a failure.<br>" +
                "If the user is created, they are also auto-logged in.<br>" +
                "Note: currently, you do not need to be logged in to create a new user.<br>" +
                "Returns a json object that contains the exact same as login<br>"
        })) {
            // Note: anyone allowed to create a new user
            // apis/<version>/create-a-user w/ password
            utdb.addUser(req.params.username, req.params.password, function(result) {
                if (!result) {
                    console.log("added new user "+req.params.username+" FAILED");
                    sendJson(res, {response:false, message:"createuser failed"});

                } else {
                    // set result.id into the session
                    console.log("added new user "+req.params.username+" OK: id="+result.id);
                    doLogin(req, res, result, "createuser ok");
                }
            });
        }
    });

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/:version/login/:username/:password', function(req, res) {
        if (!showDocs(req,res, {
            version: 1,
            api: "login",
            description: "login as a new user",
            params: [
                "username -- the user to login as",
                "password -- the cleartext password"
            ],
            longDesc: "If your username is not valid or the password doesn't match, then the login will fail.<br>" +
                "Returns a json object that contains:<br>"+
                ".. auth = bit-fields (see setauth for meaning of each bit)<br>"+
                ".. id = unique identifier for this user.  Some calls may use this id."
        })) {
            // Note: anyone allowed to request to login
            // apis/<version>/login a username w/ password
            utdb.findUser(req.params.username, req.params.password, function(result) {
                if (!result) {
                    // return "FAILED LOGIN"
                    console.log("login "+req.params.username+" FAILED");
                    sendJson(res, {response:false, message:"login failed"});

                } else {
                    // return "LOGIN OK"
                    // set result.id into the session
                    console.log("login "+req.params.username+" OK: id="+result.id+"  auth="+result.auth);
                    doLogin(req, res, result, "login ok");
                }
            });
        }
    });

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/:version/logout', function(req, res) {
        if (!showDocs(req,res, {
            version: 1,
            api: "logout",
            description: "logout the current user. Delete their session.",
            params: [
            ],
            longDesc: "This will delete the session data for the current logged in user.<br>" +
                "This call should always succeed, even if you aren't logged in."
        })) {
            // Note: anyone allowed to logout
            req.session.user = undefined;
            req.session.destroy();
            sendJson(res, {response:true, message:"logout ok"});
        }
    });

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/:version/setauth/:username/:auth', function(req, res) {
        console.log("docs="+req.query["docs"]);
        // apis/<version>/set authorization level for a given user
        if (!showDocs(req,res, {
            version: 1,
            api: "setauth",
            description: "Set the authorization level for a specified user",
            params: [
                "username -- the username to set",
                "auth level -- the new authorization (number) for the user"
            ],
            longDesc: "authorization bits:<br>" +
                "0x01 = normal logged in user<br>" +
                "0x02 = can use setauth<br>" +
                "0x04 = <br>" +
                "0x08 = <br>" +
                "0x10 = <br>" +
                "0x20 = <br>" +
                "0x40 = <br>" +
                "0x80 = <br>"
        })) {
            // Note: Must be authorized to set the authorization level for a user
//            if (isAuth(req, 0x02)) {
                // user ALLOWED to set auth
                utdb.setAuth(req.params.username, parseInt(req.params.auth), function(result) {
                    console.log("setauth by "+req.session.user.name+" for "+req.params.username+" to "+req.params.auth);
                    if (result) {
                        sendJson(res, {response:true, message:"setauth ok"});
                    } else {
                        sendJson(res, {response:false, message:"setauth failed. result="+result});
                    }
                });
//            } else {
//                console.log("setauth FAILED: username:"+req.params.username);
//                sendJson(res, {response:false, message:"setauth failed. Not authorized."});
//            }
        }
    });


    //other routes..
};