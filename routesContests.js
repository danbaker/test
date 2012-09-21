// routesContests.js
//  handle all routes related to the "contests" collection
//
//  /contests                           -> all contests
//  /contests/:id                       -> ONE contest info
//  /contests/:id/bots                  -> ALL bots for a contest
//  /contests/:id/bots/:id              -> ONE bot info
//  /contests/:id/bots/:id/plays        -> get all "plays" this bot has played
//  /contests/:id/bots/:id/plays/:id    -> get all "plays" this bot has played
var helper = require('./routesHelper');

var getContests = function() {
    return [{id:"123a6", name:"RockPaperScissors", description:"Rock Paper Scissors"}, {id:"528f1", name:"Contest 2", description:"Something goes here"}];
};

// GET /apis/:version/contests ? fields=id,name
exports.getContests = function(req, res) {
    // apis/<version>/play two users code against each other
    if (!helper.showDocs(req,res, {
        version: 1,
        api: "contests",
        description: "get a collection of contests",
        urlparams: [
        ],
        params: [
            "fields"
        ],
        longDesc: "get a collection"
    })) {
        var coll = getContests();
        coll = helper.cleanCollection(req, coll);
        helper.sendJson(res, coll);
    }
};


// GET /apis/:version/contests/:id
exports.getContests_id = function(req, res) {
    var id = req.params.id;
    var list = getContests();
    var item;
    for(var i=0; i<list.length; i++) {
        item = list[i];
        if (item.id === id) {
            helper.sendJson(res, helper.cleanItem(req, item));
            return;
        }
    }
    res.send(404);
};

