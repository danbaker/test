/*

    CONTEST

*/
var utdb = require('./utdb');
var Sandbox = require('./sand2/sandbox');
var mainHandler = require('./sand2/mainHandler');
var logMsg = require('./sand2/log').log;
var log = function(msg) {
    logMsg("CONTEST.T"+turnN+": "+msg);
};

var runDoc = undefined;             // undefined means: a contest is NOT currently running
var run_id = "0";                   // run_id for current running contest
var sand1;                          // sandbox for P1
var sand2;
var turnN;                          // which turn# running
var sandboxesDone;                  // total sanboxes that have finished/ended/done


// request to queue a contest to start running soon
// in:  doc = "runs" document:
//        doc.contest_id = contest_id;
//        doc.bots_id = [];
//        doc.bots_id[0] = bot1_id;
//        doc.bots_id[1] = bot2_id;
//        doc.users_id = [];
//        doc.users_id[0] = user1_id;
//        doc.users_id[1] = user2_id;
//        doc.logs = [];
//        doc.logs[0] = ["first log for player 1"];     // @TODO: Maybe move all "logs" to their own collection (so we can keep them "under control"
//        doc.logs[1] = ["first log for player 2"];
var queueContestToStart = function(doc) {
    if (runDoc) {
        // sorry ... a contest is already running (maybe one day, we'll queue them up for later)
        return false;
    }

    // save the "runDoc" that will be posted to the "runs" collection
    runDoc = doc;

    // POST runDoc to "runs" collection (and get back the run_id)
    utdb.postDocs(utdb.collection_runs(), "runs", runDoc, function(ok) {
        // don't know what to do with the return info ...
        if (ok && ok._id) {
            run_id = ok._id;
            exports.runContest();
        } else {
            console.log("ERROR: post run result: %j", ok);
            runDoc = undefined;
        }
    });

    // Contest queued to start soon
    return true;
};

// contest is DONE.  both players code has exited.
var finishContest = function() {
    runDoc = undefined;
//    // read in the logs from disk, and separate based on player number
//    require('./sand2/log').getLogMessages(function(logMessages) {
//        if (runDoc) {
//            runDoc.logs = logMessages;
//            // @TODO: move all logs to their own database collection ("logs") -- maybe in chunks of 50 log messages per document
//            utdb.postDocs(utdb.collection_runs(), "runs", runDoc, function(ok) {
//                // don't know what to do with the return info ...
//                runDoc = undefined;
//            });
//        } else {
//            console.log("CONTEST DONE.  Logs: %j", logMessages[0]);
//            console.log("CONTEST DONE.  Logs: %j", logMessages[1]);
//        }
//    });
};

var makeSetPlayerCall = function(pIndex) {
    var js = "";
    js += "contestAPI.setPlayer({";                 // tell API about this contest and my player info
        js += "pn:'P"+(pIndex+1)+"'";               // playerNumber (P1 or P2)
        if (runDoc) {
            js += ",contest_id:'"   +runDoc.contest_id          +"'";
            js += ",bot_id:'"       +runDoc.bots_id[pIndex]     +"'";
            js += ",user_id:'"      +runDoc.users_id[pIndex]    +"'";
            js += ",run_id:'"       +run_id                     +"'";
        }
    js += "});";
    js += "contestAPI.setPlayer = undefined;";      // remove the "setPlayer" function
    return js;
};

var startPlayer = function(pIndex, fnc) {
    var pn = "P" + (pIndex+1);                  // "P1" or "P2"
    var s = new Sandbox({pn:pn});
    // contest = the API object
    var userjs = "";
    var js = "";
    js += "console.log('DANB Hello world ... client JavaScript is RUNNING');";
    js += "console.log('DANB R='+Math.floor(Math.random()*3));";
    js += makeSetPlayerCall(pIndex);
    // @TODO: pass the contest_id and user_id over (so they can use it to log to the logs collection)
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
    js +=       "var rps=(rn===0? 'r' : rn===1? 'p' : 's');";       // r,p,s
    js +=       "console.log('DANB calling submitTurn with pick='+rps);";
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
        // this sanbox ended.  is done running code.
        sandboxesDone++;
        console.log("sandbox ended.  #="+sandboxesDone);
        if (sandboxesDone >= 2) {
            console.log("BOTH DONE");
            finishContest();
        }
        fnc(output);
    });
    return s;
};

// start running a contest between P1 and P2 (call callback fnc when done)
exports.runContest = function(id_p1, id_p2, fnc) {
    // RESET EVERYTHING FOR A NEW CONTEST
    require('./sand2/log').resetLogFile();
    turnN = 1;
    sandboxesDone = 0;

    // START UP PLAYER 1
    sand1 = startPlayer(0, function(output) {
    });
    // START UP PLAYER 2
    sand2 = startPlayer(1, function(output) {
    });
    if (fnc) fnc("contest running...");
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

exports.queueContestToStart = queueContestToStart;