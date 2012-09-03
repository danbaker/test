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
        uobj.auth = result.auth;                // authorization level for the logged in user
        // save this newly created user object in the session
        req.session.user = uobj;

        sendJson(res, {response:true, message:msg});        // return "logged in OK" or "created user OK"
    };
    var isAuth = function(req, n) {
        if (req.session && req.session.user)
            return req.session.user.auth & n;               // 1, 2, 4, 8 ...  (see utdb.js)
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

    app.get('/apis/:version/status', function(req, res) {
        console.log("STATUS: %j", req.session);
        sendJson(res, {response:true, message:"status ok"});//, theClient:utdb.testTheClient});
        utdb.dumpAllUsers();
    });

    app.get('/apis/:version/createuser/:username/:password', function(req, res) {
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
    });
    app.get('/apis/:version/login/:username/:password', function(req, res) {
        // apis/<version>/login a username w/ password
        utdb.findUser(req.params.username, req.params.password, function(result) {
            if (!result) {
                // return "FAILED LOGIN"
                console.log("login "+req.params.username+" FAILED");
                sendJson(res, {response:false, message:"login failed"});

            } else {
                // return "LOGIN OK"
                // set result.id into the session
                console.log("login "+req.params.username+" OK: id="+result.id);
                doLogin(req, res, result, "login ok");
            }
        });
    });
    app.get('/apis/:version/logout', function(req, res) {
        req.session.user = undefined;
        req.session.destroy();
        sendJson(res, {response:true, message:"logout ok"});
    });
    app.get('/apis/:version/setauth/:username/:auth', function(req, res) {
        // apis/<version>/set authorization level for a given user
        if (isAuth(req, 0x80)) {
            // user ALLOWED to set auth
            utdb.setAuth(req.params.username, parseInt(req.params.auth), function(result) {
                console.log("setauth by "+req.session.user.name+" for "+req.params.username+" to "+req.params.auth);
                if (result) {
                    sendJson(res, {response:true, message:"setauth ok"});
                } else {
                    sendJson(res, {response:false, message:"setauth failed. result="+result});
                }
            });
        } else {
            console.log("setauth FAILED: username:"+req.params.username);
            sendJson(res, {response:false, message:"setauth failed. Not authorized."});
        }
    });


    //other routes..
};