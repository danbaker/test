// routesBots.js
//  handle all routes related to the "bots" collection
//
//  /bots                   -> all bots (you can only get/set code for your own bots)
//  /bots/:id               -> ONE bot
//  /bots/:id/plays         -> get all "plays" this bot has played
//  /bots/:id/plays/:id     -> get all "plays" this bot has played
var helper = require('./routesHelper');
var utdb = require('./utdb');


// GET /apis/:version/bots ?fields=name & contest=1234
exports.getBots = function(req, res) {
    if (helper.isLoggedIn(req)) {
        if (!helper.showDocs(req,res, {
            version: 1,
            api: "bots",
            description: "get a collection of bots",
            urlparams: [
            ],
            params: [
                "fields --- limit the fields to return",
                "contest --- the contest to get bots for"
            ],
            longDesc: "get a collection"
        })) {
            console.log("calling getContests");
            utdb.getContests({}, function() {
                console.log("getContests called callback");
            });
            helper.sendJson(res, []);
        }
    } else {
        res.send(404);
    }
};


// GET /apis/:version/bots/:id
exports.getBots_id = function(req, res) {
    var id = req.params.id;
    if (helper.isLoggedIn(req)) {
        // @TODO: query to get bot
    }
    res.send(404);
};
