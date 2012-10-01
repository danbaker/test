// mainHandler.js
//  MAIN APP: handle packets of data sent from child-apps

var logMsg = require('./log').log;
var packet = require('./packet');
var contest;                                    // set by calling "startContest"

var lastJSON = {};
var log = function(msg) {
    logMsg("mainHandler -- Player:"+lastJSON.pn+" op:"+lastJSON.op+" --- "+msg);
};

var sand1;
var sand2;

log("mainHanlder.js loaded");

// json = object from client
// stream = stdin for the client (way to send data back to client)
var process = function(json, stream, sand) {
    log(". . . process");
    lastJSON = json;
    var data = json.data;
    var sandOther = (sand === sand1? sand2 : sand1);
    switch(json.op) {
        case "submitTurn":
            log(". . . in mainHandler.process op=submitTurn by player "+json.pn+"=="+sand.getPlayerN()+" nextPlayer="+sandOther.getPlayerN());
            var isOver = contest.submitTurn(data, sand, sandOther);
            if (!isOver) {
                packet.sendJson({op:"runNextTurn"}, sandOther.getStream());
            } else {
                sand1.signalGameOver();
                sand2.signalGameOver();
            }
            break;
        default:
            log("ERROR: unknown op("+json.op+")");
            break;
    }
};

// set the various sandboxes used in this contest
var setSandboxes = function(s1,s2) {
    log("setSandboxes");
    sand1 = s1;
    sand2 = s2;
};

// START the contest (with player1 starting)
var startContest = function(theContest) {
    contest = theContest;
    // give a brief pause ... so all apps can startup and be ready to run
    setTimeout(function() {
        log("= = = = = = = startContest = = = = = = =");
        packet.sendJson({op:"runNextTurn"}, sand1.getStream());
    }, 500);
};

exports.process = process;
exports.setSandboxes = setSandboxes;
exports.startContest = startContest;
