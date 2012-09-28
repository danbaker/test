/*
    ROUTES:

    /apis/<api-version-number>/<api-name>/<arguments...>
    /apis/doc

 */


module.exports = function(app){

    var utdb = require('./utdb');
    var contest = require('./contest');
    var helper = require('./routesHelper');
    var routesBots = require('./routesBots');
    var routesContests = require('./routesContests');
    var routesRuns = require('./routesRuns');
    var routesSessions = require('./routesSessions');
    var routesUsers = require('./routesUsers');

    // FUNCTION: perform login of user
    var doLogin = function(req, res, result, msg) {
        // create a new, empty, "user" object in the session
        var username = req.params.username || req.query.username || req.body.username;
        var password = req.params.password || req.query.password || req.body.password;
        var uobj = {};
        uobj.name = username;                   // username the user supplied
        uobj.id = result.id;                    // id of the logged in user
        uobj._id = result._id;                  // id of the logged in user
        uobj.auth = result.auth | 1;            // authorization level for the logged in user (ensure logged-in)
        console.log("login: %j", uobj);
        // save this newly created user object in the session
        req.session.user = uobj;

        sendJson(res, {response:true, id: uobj.id, auth: uobj.auth, name: uobj.name, message:msg});        // return "logged in OK" or "created user OK"
    };
    var sendJson = helper.sendJson;
    var isLoggedIn = helper.isLoggedIn;
    var isAuth = helper.isAuth;
    var showDocs = helper.showDocs;



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



    // // // // // // // // // // // // //
    //
    //  user authentication (sessions)

    app.get('/apis/:version/sessions', function(req, res) {
        routesSessions.getSessions(req, res);
    });
    app.post('/apis/:version/sessions', function(req, res) {
        routesSessions.postSessions(req, res);
    });
    app.delete('/apis/:version/sessions', function(req, res) {
        routesSessions.deleteSessions(req, res);
    });

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    app.get('/apis/:version/createuser/:username/:password', function(req, res) {
        if (!showDocs(req,res, {
            version: 1,
            api: "createuser",
            description: "create a new user with initial password",
            urlparams: [
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
            urlparams: [
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
            urlparams: [
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
            urlparams: [
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
            urlparams: [
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
            urlparams: [
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
            urlparams: [
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

    //
    //  /contests                       -> all contests
    //  /contests/:id                   -> ONE contest info
    //  /contests/:id/bots              -> ALL bots for a contest
    //  /contests/:id/bots/:id          -> ONE bot info
    //  /bots/:id                       -> ONE bot info (IF this is your bot, you get the code too)
    //  /contests/:id/bots/:id/plays    -> get all "plays" this bot has played
    //  /plays/:id                      -> get ONE "play history" (for replay)
    //  .../<COLLECTION>/<VERB>         -> run verb on the entire collection (verb can't be an "id")
    //  .../<COLLECTION>/count          -> return the # of items on the collection
    //  .../<COLLECTION>/:id/<VERB>     -> run verb on a single item in the collection (verb can't be the name of another collection)
    //

    // // // // // // // // // // // // //
    //
    //  contests

    // create contest
    app.post('/apis/:version/contests', function(req, res) {
        if (!showCollectionHelp(req, res, "POST", "contests")) routesContests.postContests(req, res);
    });
    // get list of all contests
    app.get('/apis/:version/contests', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "contests")) routesContests.getContests(req, res);
    });
    // get one contest
    app.get('/apis/:version/contests/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "contests")) routesContests.getContests_id(req, res);
    });
    // update one contest
    app.put('/apis/:version/contests/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "PUT", "contests")) routesContests.putContests_id(req, res);
    });
    // delete one contest
    app.delete('/apis/:version/contests/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "DELETE", "contests")) routesContests.deleteContests_id(req, res);
    });
    // create bot for a contest (for current logged in user)
    app.post('/apis/:version/contests/:id/bots', function(req, res) {
        if (!showCollectionHelp(req, res, "POST", "bots")) {
            if (helper.isLoggedIn(req)) {
                var doc = helper.getParam(req, "doc");                  // doc is a string:  "{code:"var a=1;}"
                if (!doc) {                                             // contest_id specified on the URL -- is put into the document
                    sendJson(res, {response:false, message:"POST bot failed.  missing doc"});
                } else {
                    // Note: doc is a STRING at this point
                    try {
                        console.log("--1--POST bot.  original doc string="+doc);
                        doc = JSON.parse(doc);                          // doc is a real object
                        console.log("--2--POST bot.  doc obj=%j", doc);
                        doc.contest_id = helper.getParam(req, "id");        // force the contest_id in the doc
                        console.log("--3--POST bot.  doc obj=%j", doc);
                        doc = JSON.stringify(doc);                          // doc is back to a string
                        console.log("--4--POST bot.  new doc string="+doc);
                        var failed = helper.setParam(req, "doc", doc);
                        routesBots.postBots(req, res);
                    } catch (e) {
                        console.log("JSON.parse failed bot doc: %j",doc);
                        sendJson(res, {response:false, message:"POST bot failed.  bad doc"});
                    }
                }
            } else {
                res.send(401);  // not logged in
            }
        }
    });
    // get list of all bots for a contest
    app.get('/apis/:version/contests/:contest_id/bots', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "bots")) {
            console.log("- - GET bots for contests="+req.params.contest_id);
            routesBots.getBots(req, res);
        }
    });
    // get one bot for a contest
    app.get('/apis/:version/contests/:contest_id/bots/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "bots")) {
            routesBots.getBots_id(req, res);
        }
    });
    // put one bot for a contest
    app.put('/apis/:version/contests/:contest_id/bots/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "PUT", "bots")) {
            if (!req.params || !req.params.doc) {
                sendJson(res, {response:false, message:"PUT bot failed.  missing doc"});
            } else {
                req.params.doc.contest_id = helper.getParam(req, "contest_id"); // contest_id specified on the URL -- is put into the document
                //req.params.doc.user_id = helper.getUserId(req);                 // user_id is put into the document
                routesBots.putBots_id(req, res);
            }
        }
    });


    // // // // // // // // // // // // //
    //
    //  bots

    app.post('/apis/:version/bots', function(req, res) {
        if (!showCollectionHelp(req, res, "POST", "bots")) routesBots.postBots(req, res);
    });
    app.get('/apis/:version/bots', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "bots")) routesBots.getBots(req, res);
    });
    app.get('/apis/:version/bots/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "bots")) routesBots.getBots_id(req, res);
    });
    app.put('/apis/:version/bots/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "PUT", "bots", idParam)) routesBots.putBots_id(req, res);
    });
    app.delete('/apis/:version/bots/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "DELETE", "bots", idParam)) routesBots.deleteBots_id(req, res);
    });

    // // // // // // // // // // // // //
    //
    //  users

    app.get('/apis/:version/users', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "users")) routesUsers.getUsers(req, res);
    });
    app.get('/apis/:version/users/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "users")) routesUsers.getUsers_id(req, res);
    });
    app.put('/apis/:version/users/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "PUT", "users", idParam)) routesUsers.putUsers_id(req, res);
    });
    app.delete('/apis/:version/users/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "DELETE", "users", idParam)) routesUsers.deleteUsers_id(req, res);
    });


    // // // // // // // // // // // // //
    //
    //  runs

    app.post('/apis/:version/runs', function(req, res) {
        if (!showCollectionHelp(req, res, "POST", "runs")) routesRuns.postRuns(req, res);
    });
    app.get('/apis/:version/runs', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "runs")) routesRuns.getRuns(req, res);
    });
    app.get('/apis/:version/runs/:id', function(req, res) {
        if (!showCollectionHelp(req, res, "GET", "runs")) routesRuns.getRuns_id(req, res);
    });

    var idParam = "id --- the id of the bot";
    var showCollectionHelp = function(req, res, method, collName, id1) {
        // convert and clean up the "doc" parameter
        var doc = helper.getParam(req, "doc");
        doc = helper.parseToObject(doc);
        req.params.doc = doc;

        var obj = {
            version: 1,
            api: collName,
            method: method,
            description: "",
            urlparams: [
            ],
            params: [
            ],
            longDesc: "get a collection"
        };
        if (id1) obj.urlparams.push(id1);
        if (method === "POST") {
            obj.params.push("doc --- the entire document to add as a "+collName);
            obj.description = "create a new "+collName;
        }
        if (method === "PUT") {
            obj.params.push("doc --- the entire document to replace the old "+collName);
            obj.description = "replace a "+collName+" with a new one";
        }
        if (method === "GET") {
            obj.params.push("doc --- the entire document to replace the old "+collName);
            obj.description = "replace a "+collName+" with a new one";
        }
        return helper.showDocs(req,res, obj);
    };

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Note: anyone allowed to ask for documentation
    var docs = function(req, res) {
        var msg = "";
        msg += "Documentation of all known endpoint routes<br>";
        msg += "Note: you can call any endpoint with ?doc=1 to get detailed information about the route";
        msg += "endpoint --- description<br>";
        msg += "/apis/1/status --- ask the server if it is running<br>";
        msg += "/apis/1/doc --- this page<br>";
        msg += "/apis/1/sessions --- the sessions collection: GET for status, POST to login, DELETE to logout<br>";
        msg += "/apis/1/contests --- the contests collection: GET the list<br>";
        msg += "/apis/1/contests/ID --- a contest: GET the contest object<br>";
        msg += "/apis/1/bots --- the bots collection: GET the list, POST to add a bot to a contest<br>";
        msg += "/apis/1/bots/ID --- a bot: GET the bot object<br>";
        msg += "<br>";
        msg += "<br>";
        msg += "/apis/1/createuser/USERNAME/PASSWORD --- create a new user with password<br>";
        msg += "/apis/1/login/USERNAME/PASSWORD --- login a user<br>";
        msg += "/apis/1/logout --- logout the current user<br>";
        msg += "/apis/1/setauth/USERNAME/AUTH --- force a users auth level<br>";
        msg += "/apis/1/setcode?code=CODE --- set the code for the contest for current user<br>";
        msg += "/apis/1/getcode --- get the code for the contest for current user<br>";
        msg += "/apis/1/playnow/USERNAME --- run contest between logged-in user and specified USER, and return json results<br>";
        msg += "<br>";
        msg += "?fields=name,description,id --- limits the fields that are returned to those specified<br>";
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(msg);
    };
    app.get('/apis/doc', function(req, res) {
        docs(req, res);
    });
    app.get('/apis/docs', function(req, res) {
        docs(req, res);
    });

    app.get('/contests/:contestid', function(req, res) {
        res.sendfile('./public/index.html');
    });


};
