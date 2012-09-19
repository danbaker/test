/*

    CONTEST

*/
var Sandbox = require('./sand2/sandbox');
//var api = require('./sand/api');
//var comm = require('./sand/comm');


// NOTE: the following are indicators of which STAGE we are in
//      {did:"P1MA", now:"P1"}  --> means that pre-1 finished, and is now ready for P1 to run
//      {did:"P1"}              --> means that P1 finished and is ready for "the next step" (M1B) to run
var mpre1 = "P1MA";     // machine pre-1
var p1 = "P1";          // player-1
var mpost1 = "P1MB";    // machine post-1
var mpre2 = "P2MA";     // machine pre-2
var p2 = "P2";          // player 2
var mpost2 = "P2MB";    // machine post-2


var p1Running;
var p2Running;


var startPlayer = function(pn, fnc) {
    var s = new Sandbox({pn:pn});
    // contest = the API object
    var userjs = "";
//    userjs += "function runTurn() {";
//    userjs +=   "contestAPI.submitTurn({});";
//    userjs += "}";

    var js = "";
    js += "console.log('Hello world');";
    js += "contestAPI.setPlayer('"+pn+"');";        // tell the API which player I am
    js += userjs;                                   // run player code
    js += "setTimeout(function() {";
    js +=   "console.log('from the timeout 1');";
    js +=   "contestAPI.setPlayer(1);";
    js +=   "contestAPI.submitTurn({user:'Dan'});";
    js +=   "console.log('from the timeout 2');";
    js += "}, 100);";
    js += "console.log('end of code');";
    js += "contestAPI.runNextTurn = function() {";
    js +=   "console.log('NEAT-O -- running code inside the client, called form the main server!');";
    js += "};";
    s.run( js, function( output ) {
        // output.result = returned value
        // output.console = returned console logs (doesn't seem to work on heroku)
        fnc(output);
    });
};

// run a contest between P1 and P2 (call callback fnc when done)
exports.runContest = function(id_p1, id_p2, fnc) {
    // RESET EVERYTHING FOR A NEW CONTEST
    p1Running = true;
    p2Running = true;
//    comm.resetLog();

    // START UP MACHINE ... should set file to: {did:"P1MA", now:"P1"}
//    comm.log("indicating NOTHING is next .. allow players to startup");
//    comm.writeJson({starting:true}, function() {
//        comm.log("start P1");
        // START UP PLAYER 1
        startPlayer(p1, function(output) {
            p1Running = false;
//            comm.log("P1 code finished");
//            comm.writeJson({done:true}, function() {});     // kick anyone waiting on the file
        });
//        // START UP PLAYER 2
//        startPlayer(p2, function(output) {
//            p2Running = false;
//        });
//    });
    fnc("contest running...");
//    continueContest();
};

// P1MA -- P1 -- P1MB -- P2MA -- P2 -- P2MB (loop)
var continueContest = function() {
    if (p1Running && p2Running) {
        comm.log("--continueContest");
        comm.log("--indicating: P1 turn");
        comm.writeJson({did:p1+"MA", now:p1}, function() {
            comm.log("--MAIN waiting for P1 to finish");
            comm.waitForTurn(p1+"MB", function() {
                comm.log("--P1 finished ... MAIN working again");
                // @TODO: process P1 data here ...
                // @TODO: prepare for P2 to play
                if (p1Running && p2Running) {
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
                } else {
                    comm.log("--contest over (NOT starting P2)");
                }
            });
        });
    } else {
        comm.log("--contest over (NOT starting P1)");
    }
};
