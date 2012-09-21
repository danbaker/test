// routesBots.js
//  handle all routes related to the "bots" collection
//
//  /bots                   -> all bots (you can only get/set code for your own bots)
//  /bots/:id               -> ONE bot
//  /bots/:id/plays         -> get all "plays" this bot has played
//  /bots/:id/plays/:id     -> get all "plays" this bot has played
var helper = require('./routesHelper');


// GET /apis/:version/bots
exports.getBots = function(req, res) {
    if (helper.isLoggedIn(req)) {
        helper.sendJson(res, []);
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

