/*
    ROUTES:

    /apis/<api-version-number>/<api-name>/<arguments...>
    /apis/doc

 */


module.exports = function(app){

    var utdb = require('./utdb');
    var contest = require('./contest');

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
        console.log("login: %j", uobj);
        // save this newly created user object in the session
        req.session.user = uobj;

        sendJson(res, {response:true, auth: uobj.auth, name: uobj.name, message:msg});        // return "logged in OK" or "created user OK"
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
        if (utdb.isLocal()) {
            var uobj = {};
            uobj.name = "LocalDANB";
            uobj.id = 12345;
            uobj.auth = 255;
            req.session.user = uobj;
        }
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



    // // // // // // // // //
    //
    //  user authentication

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    //  GET ? username=dan&password=secret
    app.get('/apis/:version/sessions', function(req, res) {
        if (!showDocs(req,res, {
            version: 1,
            api: "GET sessions",
            description: "check if logged in",
            params: [
            ],
            longDesc: "If your username is not valid or the password doesn't match, then the login will fail.<br>" +
                "Returns a json object that contains:<br>"+
                ".. auth = bit-fields (see setauth for meaning of each bit)<br>"+
                ".. id = unique identifier for this user.  Some calls may use this id."
        })) {
            if (isAuth(req, 0x01)) {
                // IS logged in
                var uobj = req.session.user;
                sendJson(res, {response:true, auth: uobj.auth, name: uobj.name, message:"logged in"});
            } else {
                // NOT logged in
                res.send(404);
            }
        }
    });
    app.post('/apis/:version/sessions', function(req, res) {
        if (!showDocs(req,res, {
            version: 1,
            api: "POST sessions",
            description: "login as a new user",
            params: [
            ],
            longDesc: "If your username is not valid or the password doesn't match, then the login will fail.<br>" +
                "Returns a json object that contains:<br>"+
                ".. auth = bit-fields (see setauth for meaning of each bit)<br>"+
                ".. id = unique identifier for this user.  Some calls may use this id."
        })) {
            // Note: anyone allowed to request to login
            // apis/<version>/login a username w/ password
            var username = req.params.username || req.query.username || req.body.username;
            var password = req.params.password || req.query.password || req.body.password;
            console.log("POST session "+username+","+password);
            utdb.findUser(username, password, function(result) {
                if (!result) {
                    // return "FAILED LOGIN"
                    console.log("login "+req.params.username+" FAILED");
                    res.send(404);
                } else {
                    // return "LOGIN OK"
                    // set result.id into the session
                    console.log("login "+req.params.username+" OK: id="+result.id+"  auth="+result.auth);
                    doLogin(req, res, result, "login ok");
                }
            });
        }
    });
    app.delete('/apis/:version/sessions', function(req, res) {
        req.session.user = undefined;
        req.session.destroy();
        sendJson(res, {response:true, message:"logout ok"});
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
            if (isAuth(req, 0x02)) {
                // user ALLOWED to set auth
                utdb.setAuth(req.params.username, parseInt(req.params.auth), function(result) {
                    if (result) {
                        sendJson(res, {response:true, message:"setauth ok"});
                    } else {
                        sendJson(res, {response:false, message:"setauth failed. result="+result});
                    }
                    console.log("setauth by "+req.session.user.name+" for "+req.params.username+" to "+req.params.auth);
                });
            } else {
                console.log("setauth FAILED: username:"+req.params.username);
                sendJson(res, {response:false, message:"setauth failed. Not authorized."});
            }
        }
    });



    // // // // // // // // //
    //
    //  user contest code

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.post('/apis/:version/setcode', function(req, res) {
        setcode(req, res);
    });
    app.get('/apis/:version/setcode', function(req, res) {
        setcode(req, res);
    });
    var setcode = function(req, res) {
        // apis/<version>/set the code for the current logged-in user (later, we will need to know which contest)
        if (!showDocs(req,res, {
            version: 1,
            api: "setcode",
            description: "Set the code for the contest",
            params: [
            ],
            longDesc: "POST/GET a variable called 'code' with the string value for the code to set<br>" +
                        " Example:  /apis/1/setcode?code=var a=1;"
        })) {
            // Note: Must be logged in
            if (isAuth(req, 0x01)) {
                // user ALLOWED to set the code
                console.log(req.params);
                var code = req.params.code;
                if (!code) code = req.query.code;
                if (!code) code = req.body.code;
                utdb.setCode(req.session.user.id, code, function(result) {
                    if (result) {
                        sendJson(res, {response:true, message:"setcode ok"});
                    } else {
                        sendJson(res, {response:false, message:"setcode failed"});
                    }
                });
            } else {
                sendJson(res, {response:false, message:"setcode failed.  not logged in."});
            }
        }
    };

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/:version/getcode', function(req, res) {
        getcode(req, res);
    });
    var getcode = function(req, res) {
        // apis/<version>/get the code for the current logged-in user (later, we will need to know which contest)
        if (!showDocs(req,res, {
            version: 1,
            api: "getcode",
            description: "Get the code for the contest",
            params: [
            ],
            longDesc: "Returns the current contest code as {code:CODE}<br>"
        })) {
            // Note: Must be logged in
            if (isAuth(req, 0x01)) {
                // user ALLOWED to get the code
                utdb.getCode(req.session.user.id, function(result) {
                    if (result != undefined) {
                        sendJson(res, {response:true, code:result});
                    } else {
                        sendJson(res, {response:false, message:"getcode failed"});
                    }
                });
            } else {
                sendJson(res, {response:false, message:"getcode failed.  not logged in."});
            }
        }
    };

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/:version/playnow/:username', function(req, res) {
        playnow(req, res);
    });
    var playnow = function(req, res) {
        // apis/<version>/play two users code against each other
        if (!showDocs(req,res, {
            version: 1,
            api: "playnow",
            description: "Run contest between me and another user",
            params: [
                "username --- name of user to play against"
            ],
            longDesc: "Runs logged in user against specified user, and returns the JSON"
        })) {
            // Note: Must be logged in
            if (isAuth(req, 0x01)) {
                var p2_name = req.params.username;
                var p1_id = req.session.user.id;
                utdb.getIdForUsername(p2_name, function(p2_id) {
                    if (!p2_id) {
                        sendJson(res, {response:false, message:"playnow failed.  user not found: "+p2_name});
                    } else {
                        // p1_id == player1 ID
                        // p2_id == player2 ID
                        contest.runContest(p1_id, p2_id, function(obj) {
                            sendJson(res, {response:true, message:"playnow finished", data:obj});
                        });
                    }
                });
            } else {
                sendJson(res, {response:false, message:"playnow failed.  not logged in."});
            }
        }
    };

        //other routes..



    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/doc', function(req, res) {
        // Note: anyone allowed to ask for documentation
        var msg = "";
        msg += "Documentation of all known endpoint routes<br>";
        msg += "Note: you can call any endpoint with ?doc=1 to get detailed information about the route";
        msg += "endpoint --- description<br>";
        msg += "/apis/1/status --- ask the server if it is running<br>";
        msg += "/apis/1/doc --- this page<br>";
        msg += "/apis/1/sessions --- the sessions collection: GET for status, POST to login, DELETE to logout<br>";
        msg += "/apis/1/code --- the code collection: GET for logged-in users code, POST to set new code<br>";
        msg += "<br>";
        msg += "/apis/1/createuser/USERNAME/PASSWORD --- create a new user with password<br>";
        msg += "/apis/1/login/USERNAME/PASSWORD --- login a user<br>";
        msg += "/apis/1/logout --- logout the current user<br>";
        msg += "/apis/1/setauth/USERNAME/AUTH --- force a users auth level<br>";
        msg += "/apis/1/setcode?code=CODE --- set the code for the contest for current user<br>";
        msg += "/apis/1/getcode --- get the code for the contest for current user<br>";
        msg += "/apis/1/playnow/USERNAME --- run contest between logged-in user and specified USER, and return json results<br>";
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(msg);
    });


};