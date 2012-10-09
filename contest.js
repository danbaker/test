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

var contestDoc = undefined;         // the doc from contests being run right now
var runDoc = undefined;             // undefined means: a contest is NOT currently running
var run_id = "0";                   // run_id for current running contest
var sand1;                          // sandbox for P1
var sand2;
var turnN;                          // which turn# running
var maxTurns = 7;                   // max turns each player gets (1 turn === each player submit)
var isOver = false;                 // true means: contest is over
var p1_win = 0;
var p2_win = 0;
var sandboxesDone = 0;              // total sanboxes that have finished/ended/done
var theContest;                     // a runs the known contest interface (see contest_rps)
var replays = [];                   // the array of all data needed to replay this run
//theContest = require("./contest_hex");      // @TODO: create a differnt "contest_any.js" that will run code from the contest_doc

// request to queue a contest to start running soon
// in:  doc = "runs" document:
//        doc.contest_id = contest_id;
//        doc.bots_id = [];
//        doc.bots_id[0] = bot1_id;
//        doc.bots_id[1] = bot2_id;
//        doc.users_id = [];
//        doc.users_id[0] = user1_id;
//        doc.users_id[1] = user2_id;
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
        if (ok && ok[0] && ok[0]._id) {
            run_id = ok[0]._id;
            utdb.getDoc(utdb.collection_contests(), "contests", runDoc.contest_id, function(cDoc) {
                contestDoc = cDoc;
                // contestDoc   .name
                //              .defaultCode = bot code
                //              .code = contest code
                if (contestDoc.code) {
                    theContest = require("./contest_sandbox").runCode(contestDoc.code);
                } else {
                    theContest = require("./contest_hex");  // stupid default contest code (@TODO: remove this line)
                }
                exports.runContest();
            });
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
};

//make the js call to "contestAPI.setPlayer" for a known player
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
/*
contestAPI.runNextTurn = function() {
  var rn = Math.floor(Math.random()*3);         // 0,1,2
  var rps = (rn===0? 'r' : rn===1? 'p' : 's');  // r,p,s
  contestAPI.submitTurn({pick:rps});
};
 */
var startPlayer = function(pIndex, fnc) {
    var pn = "P" + (pIndex+1);                  // "P1" or "P2"
    var s = new Sandbox({pn:pn});
    utdb.getDoc(utdb.collection_bots(), "bots", runDoc.bots_id[pIndex], function(botDoc) {
        // get the JavaScript to run for this player/user/bot
        var userjs = "";
        if (botDoc && botDoc.code) {
            // code came from the bot
            userjs = botDoc.code;
            console.log("GOT BOT CONTEST CODE: "+userjs);
        } else if (contestDoc && contestDoc.defaultCode) {
            // bot had no code ... use default code for the contest
            userjs = contestDoc.defaultCode;
        }
        // build the entire JavaScript to run for this player/bot
        var js = "console.log('code running');";
        js += makeSetPlayerCall(pIndex);
        // server calls the "contestAPI.runNextTurn" function when it is time to run a turn
        js += userjs;
        // @TODO: REMOVE THIS ... for now, IF they don't provide a "runNextTurn" function ... give them one
        if (userjs.indexOf("runNextTurn") < 0) {
            js += "contestAPI.runNextTurn = function() {";
            js +=       "var rn = Math.floor(Math.random()*3);";              // 0,1,2
            js +=       "var rps = (rn===0? 'r' : rn===1? 'p' : 's');";       // r,p,s
            js +=       "console.log('selected '+rps);";
            js +=       "contestAPI.submitTurn({pick:rps});";
            js += "};";
        }
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
    });
    return s;
};

exports.queueContestToStart = queueContestToStart;



// start running a contest between P1 and P2
exports.runContest = function() {
    // * * * * * * * * * * * * * * * * *
    // RESET EVERYTHING FOR A NEW CONTEST
    require('./sand2/log').resetLogFile();
    turnN = 1;
    isOver = false;
    sandboxesDone = 0;
    replays = [];

    // START UP PLAYER 1
    sand1 = startPlayer(0, function(output) {
    });
    // START UP PLAYER 2
    sand2 = startPlayer(1, function(output) {
    });
    mainHandler.setSandboxes(sand1, sand2);
    mainHandler.startContest(require('./contest'));
    theContest.reset(sand1, sand2);
//    if (fnc) fnc("contest running...");               // @TODO: do this after calling this function
};

// one of the bots (sand) is submitting data (json) for their turn
exports.submitTurn = function(json, sand, sandOther) {
    if (!isOver) {
        var replay = undefined;
        sand.savedTurn = json;
        if (sand == sand1) {
            replay = theContest.submitTurn_p1(json, sand, turnN);
        } else if (sand == sand2) {
            replay = theContest.submitTurn_p2(json, sand, turnN);
            turnN++;
        } else {
            console.log("ERROR .. bad sand passed into submitTurn")
        }
        if (replay) {
            // add this one replay to the replay array to be saved with the "run"
            replay.turn = (turnN - 1);
            replays.push(replay);
        }
        if (turnN > theContest.getOptions().maxTurns || theContest.isOverEarly()) {
            // !! contest just ended !!
            isOver = true;
            var results = theContest.getResults();      // { message: , winner: , score: }
            utdb.updateDoc(utdb.collection_runs(), "runs", run_id, function(docToUpdate, fnc) {
                console.log("About to update run: %j", docToUpdate);
                docToUpdate.winner = results.winner;            // "P1"
                docToUpdate.score = results.score;              // 3
                docToUpdate.winnerMsg = results.message;        // "Player 1 won 3 times. Player 2 won 2 times."
                docToUpdate.replay = replays;                   // [ { turn: 1 ... }, { turn: 2 ... } ... ]
                fnc(docToUpdate);
            }, function(ok) {
                if (ok) {
                    // doc was updated OK
                } else {
                    console.log("ERROR: run failed to update with winner="+results.winner+" run_id="+run_id);
                }
            });
        }
    }
    return isOver;
};

// one of the bots is sending info (data) and wants a response (sent back via fnc)
// usually, this is used for the bot to get previous runs info from the database
exports.sendAndReturn = function(subop, data, sand, fnc) {
    log("contest.sendAndReturn -- process request and return data -- subop="+subop);
    console.log("= = = = = in contest.sendAndReturn -- subop="+subop);
    // TODO:
    //  1) use "subop" as a function name ("sendAndReturn_<subop>")
    //  2) check if "theContest.<function>" exists -- if it does, call it
    //  3) else, check if '<function> exists locally -- if it does, call it
    var subopName = "sendAndReturn_"+subop;
    var retData = {};
    if (theContest && theContest[subopName]) {
        retData = theContest[subopName](data, sand);
    } else if (sendAndReturn_functions[subopName]) {
        retData = sendAndReturn_functions[subopName](data, sand);
    }
//    var retData = {data1:"Hello", data2:"world"};
    retData.INTERNAL_fnc_id = data.INTERNAL_fnc_id;
    fnc(retData);
};

var sendAndReturn_functions = {
    sendAndReturn_queryRuns: function(data, sand) {
        console.log("= = = = contest.queryRuns -- YEA!");
        return {data1:"contest.queryRuns"};
    }
};