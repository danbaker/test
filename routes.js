module.exports = function(app){

    var utdb = require('./utdb');

    // HELPER: send JSON to client
    var sendJson = function(res, json) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(json));
    };
    // FUNCTION: perform login of user
    var doLogin = function(req, res, result, msg) {
        req.session.loginId = result.id;
        req.session.loginUser = req.params.username;
        sendJson(res, {response:true, message:msg});
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
    app.get('/', function(req, res) {
        res.send('The UtahJS World is AMAZING -- Hello planet -- 15<br>');
        console.log(req.session);
    });

    app.get('/apis/:version/status', function(req, res) {
        console.log("STATUS: %j", req.session);
        sendJson(res, {response:true, message:"status ok"});
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
        req.session.loginId = undefined;
        req.session.loginUser = undefined;
        req.session.destroy();
        sendJson(res, {response:true, message:"logout ok"});
    });


    //other routes..
};