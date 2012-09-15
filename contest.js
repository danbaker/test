/*

    CONTEST

*/
var Sandbox = require('./sand/sandbox');
var api = require('./sand/api');
// NOTE: the following are indicators of which STAGE we are in
//      {did:"M1A", now:"P1"}   --> means that pre-1 finished, and is now ready for P1 to run
//      {did:"P1"}              --> means that P1 finished and is ready for "the next step" (M1B) to run
var mpre1 = "M1A";      // machine pre-1
var p1 = "P1";          // player-1
var mpost1 = "M1B";     // machine post-1
var mpre2 = "M2A";      // machine pre-2
var p2 = "P2";          // player 2
var mpost2 = "M2B";     // machine post-2



var startPlayer = function(pn, fnc) {
    var s = new Sandbox();
    // contest = the API object
    var userjs = "var x = contestAPI.get17(); console.log(contestAPI.getInfo()); console.log(x * x); x; ";
    var js = "";
    js += "contestAPI.setPlayer(\""+pn+"\");";
    js += userjs;
    s.run( js, function( output ) {
        // output.result = returned value
        // output.console = returned console logs (doesn't seem to work on heroku)
        fnc(output);
    });
};

// run a contest between P1 and P2 (call callback fnc when done)
exports.runContest = function(id_p1, id_p2, fnc) {

    // START UP PLAYER 1
    // 1) write {player:"P1"} to the communication-file
    // 2) startup a new node sandbox (api.js)
    //      2a) read in the communication-file and find out my player info from the file
    //      2b) write to the file {done:true} to signal this main to continue
    startPlayer(p1, function(output) {
//        fnc(output);
    });
    startPlayer(p2, function(output) {
        fnc(output);
    });
};
