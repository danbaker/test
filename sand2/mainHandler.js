// mainHandler.js
//  MAIN APP: handle packets of data sent from child-apps
//  Note: this runs in the main app (not the child shovel-app)

var logMsg = require('./log').log;
var packet = require('./packet');
var contest;                                    // set by calling "startContest"

var lastJSON = {};
var log = function(msg) {
//    logMsg("mainHandler -- Player:"+lastJSON.pn+" op:"+lastJSON.op+" --- "+msg);
//    console.log("mainHandler -- Player:"+lastJSON.pn+" op:"+lastJSON.op+" --- "+msg);
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
        case "submitReadyToStart":
            log(". . . in mainHandler.submitReadyToStart by player "+json.pn);
            sand.isReadyToStart = true;
            if (sandOther.isReadyToStart) {
                startContestTurnsNow();
            }
            break;
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
        case "sendAndReturn":
            log("mainHandler.process op=sendAndReturn subop="+json.subop+" by player "+json.pn+" -- passing along to contest");
            contest.sendAndReturn(json.subop, data, sand, function(retn) {
                log("mainHandler.process -- back from contest. passing data back to client");
                packet.sendJson({op:json.op, subop:json.subop, data:retn}, sand.getStream());
            });
            break;
        default:
            log("ERROR: unknown op("+json.op+")");
            break;
    }
};

// set the various sandboxes used in this contest
var setSandboxes = function(s1,s2,contestObj) {
    log("setSandboxes");
    sand1 = s1;
    sand2 = s2;
    contest = contestObj;
};

// START the contest (allow both bots to "prepare for contest to start"
var startContest = function(bots_id) {
    // give a brief pause ... so all apps can startup and be ready to run
    setTimeout(function() {
        log("= = = = = = = startContest = = = = = = =");
        packet.sendJson({op:"prepareToStart", me:bots_id[0], opponent:bots_id[1]}, sand1.getStream());
        packet.sendJson({op:"prepareToStart", me:bots_id[1], opponent:bots_id[0]}, sand2.getStream());
        // @TODO: do NOT send "runNextTurn" here ... wait till get a message back stating both bots are "prepared"
    }, 1000);
};

var startContestTurnsNow = function() {
    log("startContestTurnsNow");
    packet.sendJson({op:"runNextTurn"}, sand1.getStream());
};

exports.process = process;
exports.setSandboxes = setSandboxes;
exports.startContest = startContest;
