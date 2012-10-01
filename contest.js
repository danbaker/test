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
var maxTurns = 7;                   // max turns each player gets (1 turn === each player submit)
var isOver = false;                 // true means: contest is over
var p1_win = 0;
var p2_win = 0;
var sandboxesDone = 0;              // total sanboxes that have finished/ended/done


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
    // ----------------------------------------------------------------------------------------------
    // get the "default" code (NOTE: we should be able to remove this later) @TODO: remove this code
    utdb.getDoc(utdb.collection_contests(), "contests", runDoc.contest_id, function(contestDoc) {
        var contestJS = "";
        if (contestDoc && contestDoc.code) {
            contestJS = contestDoc.code;
            console.log("GOT CONTEST DEFAULT CODE: "+contestJS);
        }
    // ----------------------------------------------------------------------------------------------
        var userjs = "";
        utdb.getDoc(utdb.collection_bots(), "bots", runDoc.bots_id[pIndex], function(botDoc) {
            if (botDoc && botDoc.code) {
                userjs = botDoc.code;
                console.log("GOT BOT CONTEST CODE: "+userjs);
            } else {
                userjs = contestJS;
            }
            var js = "";
            js += makeSetPlayerCall(pIndex);
            // server calls the "contestAPI.runNextTurn" function when it is time to run a turn
            js += userjs;
            js += "contestAPI.runNextTurn = function() {";
//            js +=       "console.log('bot code: started runNextTurn');";
            js +=       "var rn = Math.floor(Math.random()*3);";              // 0,1,2
            js +=       "var rps = (rn===0? 'r' : rn===1? 'p' : 's');";       // r,p,s
//            js +=       "console.log('bot code: about to call submitTurn');";
//            js +=       "console.log('bot code: submitTurn? '+ (contestAPI.submitTurn? 'yes':'no'));";
//            js +=       "if (contestAPI.submitTurn) {";
//            js +=           "console.log('bot code: calling submitTurn');";
            js +=           "console.log('selected '+rps);"
            js +=           "contestAPI.submitTurn({pick:rps});";
//            js +=       "}";
//            js +=       "console.log('bot code: returned after call submitTurn');";
            js += "};";
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
    });
    return s;
};

// start running a contest between P1 and P2 (call callback fnc when done)
exports.runContest = function(id_p1, id_p2, fnc) {
    // * * * * * * * * * * * * * * * * *
    // RESET EVERYTHING FOR A NEW CONTEST
    require('./sand2/log').resetLogFile();
    turnN = 1;
    isOver = false;
    sandboxesDone = 0;
    p1_win = 0;
    p2_win = 0;

    // START UP PLAYER 1
    sand1 = startPlayer(0, function(output) {
    });
    // START UP PLAYER 2
    sand2 = startPlayer(1, function(output) {
    });
    if (fnc) fnc("contest running...");
    mainHandler.setSandboxes(sand1, sand2);
    mainHandler.startContest(require('./contest'));
};

// NOTE: An external node.js "player" just submitted their turn
// in:  json    = { }  === turn data object
//      sand    = the sandbox that submitted this turn
exports.submitTurn = function(json, sand, sandOther) {
    log("contest.submitTurn");
    if (!isOver) {
        sand.savedTurn = json;
        if (sand == sand2) {
            // we have P1 and P2 turns ... check winner
            var p1 = sand1.savedTurn.pick;
            var p2 = sand2.savedTurn.pick;
            var p1Win = false;
            var p2Win = false;
            if ((p1 == 'r' && p2 == 's') || (p1 == 'p' && p2 == 'r') || (p1 == 's' && p2 == 'p')) {
                p1Win = true;
                p1_win++;
            }
            if ((p2 == 'r' && p1 == 's') || (p2 == 'p' && p1 == 'r') || (p2 == 's' && p1 == 'p')) {
                p2Win = true;
                p2_win++;
            }
            log("p1="+p1+"  p2="+p2+"  p1Win="+p1Win+"  p2Win="+p2Win);
            turnN++;
            if (turnN > maxTurns) {
                // contest over ... shut them down
                isOver = true;
                var winner = "tie";         // "tie" or "P1" or "P2"
                var winnerMsg = "unknown";  // "Player 1 won 5 times. Player 2 won 2 times. Tied 3 times"
                winnerMsg = "Player 1 won "+p1_win+" times.  Player 2 won "+p2_win+" times.";
                if (p1_win > p2_win) {
                    log("CONTEST OVER: Player1 WIN P1("+p1_win+") to P2("+p2_win+")");
                    winner = "P1";
                    winnerMsg += "  Player 1 Wins";
                } else if (p2_win > p1_win) {
                    log("CONTEST OVER: Player2 WIN P1("+p1_win+") to P2("+p2_win+")");
                    winner = "P2";
                    winnerMsg += "  Player 2 Wins";
                } else {
                    log("CONTEST OVER: TIE P1("+p1_win+") to P2("+p2_win+")");
                    winner = "tie";
                    winnerMsg += "  Tie";
                }
                // @TODO: push "winning info" into the run document
                logMsg(winnerMsg);
                utdb.updateDoc(utdb.collection_runs(), "runs", run_id, function(docToUpdate, fnc) {
                    docToUpdate.winner = winner;
                    docToUpdate.winnerMsg = winnerMsg;
                    fnc(docToUpdate);
                }, function(ok) {
                    if (ok) {
                        // doc was updated OK
                    } else {
                        console.log("ERROR: run failed to update with winner="+winner);
                    }
                });
            }
        }
    }
    return isOver;
};

exports.queueContestToStart = queueContestToStart;