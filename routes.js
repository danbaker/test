module.exports = function(app){

    var utdb = require('./utdb');


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

    app.get('/apis/:version/', function(req, res) {
        // apis/<version>/api
        res.send("API version "+req.params.version);
    });
    app.get('/apis/:version/login/:username/:password', function(req, res) {
        // apis/<version>/api
        utdb.findUser(req.params.username, req.params.password, function(result) {
            if (!result) {
                // return "FAILED LOGIN"
                console.log("login "+req.params.username+" FAILED "+req.session.test1);
                res.send("login "+req.params.username+" FAILED");;

            } else {
                // return "LOGIN OK"
                // set result.id into the session
                console.log("login "+req.params.username+" OK: id="+result.id);
                req.session.loginId = result.id;
                req.session.loginUser = req.params.username;
                res.send("login "+req.params.username+" OK");;
            }
        });
    });
    app.get('/apis/:version/logout', function(req, res) {
        req.session.loginId = undefined;
        res.send("logout");
    });


    //other routes..
};