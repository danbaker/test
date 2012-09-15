/*

    CONTEST

*/
var Sandbox = require('./sand/sandbox');
var api = require('./sand/api');
var comm = require('./sand/comm');


// NOTE: the following are indicators of which STAGE we are in
//      {did:"P1MA", now:"P1"}  --> means that pre-1 finished, and is now ready for P1 to run
//      {did:"P1"}              --> means that P1 finished and is ready for "the next step" (M1B) to run
var mpre1 = "P1MA";     // machine pre-1
var p1 = "P1";          // player-1
var mpost1 = "P1MB";    // machine post-1
var mpre2 = "P2MA";     // machine pre-2
var p2 = "P2";          // player 2
var mpost2 = "P2MB";    // machine post-2



var startPlayer = function(pn, fnc) {
    var s = new Sandbox();
    // contest = the API object
    var userjs = "";
    userjs += "function runTurn() {";
    userjs +=   "contestAPI.submitTurn({});";
    userjs += "}";

    var js = "";
    js += "console.log('HI');";
    js += "contestAPI.setPlayer(\""+pn+"\");";      // tell the API which player I am
    js += userjs;                                   // run player code
    js += "runTurn();"
    js += "'exiting'";
//    js += "while(contestAPI.isRunning()) {";
//    js +=   "contestAPI.waitForTurn(function() {";
//    js +=       "runTurn();";
//    js +=    "});";
//    js += "}";

    s.run( js, function( output ) {
        // output.result = returned value
        // output.console = returned console logs (doesn't seem to work on heroku)
        fnc(output);
    });
};

// run a contest between P1 and P2 (call callback fnc when done)
exports.runContest = function(id_p1, id_p2, fnc) {
    comm.resetLog();
    // START UP MACHINE ... should set file to: {did:"P1MA", now:"P1"}
    comm.log("indicating NOTHING is next .. allow players to startup");
    comm.writeJson({starting:true}, function() {
        comm.log("start P1");
        // START UP PLAYER 1
        startPlayer(p1, function(output) {
            comm.log("P1 code finished");
        fnc(output);
        });
        // START UP PLAYER 2
//        comm.log("start P2");
//        startPlayer(p2, function(output) {
//            comm.log("P2 code finished");
//            fnc(output);
//        });
    });
//    continueContest();
};

// P1MA -- P1 -- P1MB -- P2MA -- P2 -- P2MB (loop)
var continueContest = function() {
    comm.log("--continueContest");
    comm.log("--indicating: P1 turn");
    comm.writeJson({did:p1+"MA", now:p1}, function() {
        comm.log("--MAIN waiting for P1 to finish");
        comm.waitForTurn(p1+"MB", function() {
            comm.log("--P1 finished ... MAIN working again");
            // @TODO: process P1 data here ...
            // @TODO: prepare for P2 to play
            comm.log("--indicating: P2 turn");
            comm.writeJson({did:p2+"MA", now:p2}, function() {
                comm.log("--MAIN waiting for P2 to finish");
                comm.waitForTurn(p2+"MB", function() {
                    console.log("--P2 finished ... MAIN working again");
                    // @TODO: process P2 data here ...
                    // @TODO: prepare for P1 to play
                    continueContest();
                });
            });
        });
    });
};
