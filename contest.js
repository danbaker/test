/*

    CONTEST

*/
var Sandbox = require('./sand2/sandbox');
var mainHandler = require('./sand2/mainHandler');


var startPlayer = function(pn, fnc) {
    var s = new Sandbox({pn:pn});
    // contest = the API object
    var userjs = "";
//    userjs += "function runTurn() {";
//    userjs +=   "contestAPI.submitTurn({});";
//    userjs += "}";

    var js = "";
    js += "console.log('Hello world ... client JavaScript is RUNNING');";
    js += "console.log('R='+Math.random());";
    js += "contestAPI.setPlayer('"+pn+"');";        // tell the API which player I am
    js += userjs;                                   // run player code
//    js += "setTimeout(function() {";
//    js +=   "console.log('from the timeout 1');";
//    js += "}, 100);";
//    js += "console.log('end of code');";
    // server calls the "contestAPI.runNextTurn" function when it is time to run a turn
    js += "var pickN = 1;";
    js += "contestAPI.runNextTurn = function() {";
    js +=   "console.log('Server requested client("+pn+") to runNextTurn. pick='+pickN);";
    js +=   "setTimeout(function() {";
    js +=       "var rn=Math.floor(Math.random()*3);";              // 0,1,2
    js +=       "contestAPI.submitTurn({pick:rn});";
    js +=       "pickN++;";
    js +=    "}, 100);";
    js += "};";
    // IF this is player-1 ... kick-start it running
//    if (pn === "P1") {
//        js += "setTimeout(function() {";
//            js += "contestAPI.runNextTurn();";
//        js += "}, 500);"
//    }
    s.run( pn, js, function( output ) {
        // output.result = returned value
        // output.console = returned console logs (doesn't seem to work on heroku)
        fnc(output);
    });
    return s;
};

// start running a contest between P1 and P2 (call callback fnc when done)
exports.runContest = function(id_p1, id_p2, fnc) {
    // RESET EVERYTHING FOR A NEW CONTEST

    // START UP PLAYER 1
    var s1 = startPlayer("P1", function(output) {
    });
    // START UP PLAYER 2
    var s2 = startPlayer("P2", function(output) {
    });
    fnc("contest running...");
//    continueContest();
    mainHandler.setSandboxes(s1, s2);
    mainHandler.startContest();
};
