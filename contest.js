/*

    CONTEST

*/
var Sandbox = require('./sand2/sandbox');
var mainHandler = require('./sand2/mainHandler');
var logMsg = require('./sand2/log').log;
var log = function(msg) {
    logMsg("CONTEST.T"+turnN+": "+msg);
};


var sand1;
var sand2;
var turnN;

var startPlayer = function(pn, fnc) {
    var s = new Sandbox({pn:pn});
    // contest = the API object
    var userjs = "";
//    userjs += "function runTurn() {";
//    userjs +=   "contestAPI.submitTurn({});";
//    userjs += "}";

    var js = "";
    js += "console.log('Hello world ... client JavaScript is RUNNING');";
    js += "console.log('R='+Math.floor(Math.random()*3));";
    js += "contestAPI.setPlayer('"+pn+"');";        // tell the API which player I am
    js += userjs;                                   // run player code
//    js += "setTimeout(function() {";
//    js +=   "console.log('from the timeout 1');";
//    js += "}, 100);";
//    js += "console.log('end of code');";
    // server calls the "contestAPI.runNextTurn" function when it is time to run a turn
    js += "var pickN = 1;";
    js += "contestAPI.runNextTurn = function() {";
    js +=   "setTimeout(function() {";
    js +=       "var rn=Math.floor(Math.random()*3);";              // 0,1,2
    js +=       "var rps=(rn===0? 'r' : rn===1? 'p' : 's');"        // r,p,s
    js +=       "console.log('calling submitTurn with pick='+rps);";
    js +=       "contestAPI.submitTurn({pick:rps});";
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
    turnN = 1;

    // START UP PLAYER 1
    sand1 = startPlayer("P1", function(output) {
    });
    // START UP PLAYER 2
    sand2 = startPlayer("P2", function(output) {
    });
    fnc("contest running...");
//    continueContest();
    mainHandler.setSandboxes(sand1, sand2);
    mainHandler.startContest(require('./contest'));
};

exports.submitTurn = function(json, sand, sandOther) {
    sand.savedTurn = json;
    if (sand == sand2) {
        // we have P1 and P2 turns ... check winner
        var p1 = sand1.savedTurn.pick;
        var p2 = sand2.savedTurn.pick;
        var p1Win = false;
        var p2Win = false;
        if ((p1 == 'r' && p2 == 's') || (p1 == 'p' && p2 == 'r') || (p1 == 's' && p2 == 'p')) {
            p1Win = true;
        }
        if ((p2 == 'r' && p1 == 's') || (p2 == 'p' && p1 == 'r') || (p2 == 's' && p1 == 'p')) {
            p2Win = true;
        }
        log("p1="+p1+"  p2="+p2+"  p1Win="+p1Win+"  p2Win="+p2Win);
        turnN++;
    }
};