// contest_sandbox.js
//  handle running code from the database that will handle the "running of the contest"
var logMsg = require('./sand2/log').log;
var log = function(msg) {
    logMsg("contest_sandbox: "+msg);
};




// the one-and-only function in this file
// in:  codeStr = a string which is the JavaScript to run
// out: {
//          reset(sand1, sand2);                // resets all data for a new contest between two sandboxes (sand1, sand2)
//          getOptions()                        // return the known contest-options for this contest
//          submitTurn_p1(json, sand, nTurn);   // submit a turn to run for sandbox on turn N for player#PN (1=player 1)
//          submitTurn_p2(json, sand, nTurn);   // submit a turn to run for sandbox on turn N for player#PN (1=player 1)
//          getResults()                        // return the info when contest is over
//          {
//              message: "Player1 won 3 times.  Player2 won 2 times.  Player 1 wins."
//              winner: "P1"                    // "P1", "P2", "tie"
//              score: 1                        // some way to represent the score the winner gets
//          }
//  Optional:
//          isOverEarly();                      // returns true IFF contest has ended early (before all turns are over)
//      }
exports.runCode = function(codeStr)
{
    var c = "";
    c += "log('running code inside codeStr');";
    c += "var sand1;";
    c += "var sand2;";
    c += "var p1_win;";
    c += "var p2_win;";
    c += "var tie_win;";
    c += "var runTurnNow = function() {";
    c += "    var winner = 0;";
    c += "    var p1 = sand1.savedTurn.pick;";
    c += "    var p2 = sand2.savedTurn.pick;";
    c += "    if ((p1 == 'r' && p2 == 's') || (p1 == 'p' && p2 == 'r') || (p1 == 's' && p2 == 'p')) {";
    c += "        p1_win++;";
    c += "        winner = 'P1';";
    c += "    } else if ((p2 == 'r' && p1 == 's') || (p2 == 'p' && p1 == 'r') || (p2 == 's' && p1 == 'p')) {";
    c += "        p2_win++;";
    c += "        winner = 'P2';";
    c += "    } else {";
    c += "        tie_win++;";
    c += "        winner = 'tie';";
    c += "    }";
    c += "    return {";
    c += "        p1: { pick: sand1.savedTurn.pick },";
    c += "        p2: { pick: sand2.savedTurn.pick },";
    c += "        winner: winner,";
    c += "        p1_score: p1_win,";
    c += "        p2_score: p2_win,";
    c += "        tie_score: tie_win";
    c += "    };";
    c += "};";
    c += "var rtn = {";
    c += "      reset: function(s1, s2) {";
    c += "        sand1 = s1;";
    c += "        sand2 = s2;";
    c += "        p1_win = 0;";
    c += "        p2_win = 0;";
    c += "        tie_win = 0;";
    c += "      },";
    c += "      submitTurn_p1: function(json, sand, nTurn) {";
    c += "          sand.savedTurn = json;";
    c += "          return null;";
    c += "      },";
    c += "      submitTurn_p2: function(json, sand, nTurn) {";
    c += "          sand.savedTurn = json;";
    c += "          return runTurnNow();";
    c += "      },";
    c += "      getOptions: function() {";
    c += "          return { maxTurns: 7 };";
    c += "      },";
    c += "      getResults: function() {";
    c += "          var winner = 'tie';";
    c += "          var score = 0;";
    c += "          var winnerMsg;";
    c += "          winnerMsg = 'Player 1 won '+p1_win+' times.  Player 2 won '+p2_win+' times.';";
    c += "          if (p1_win > p2_win) {";
    c += "              winner = 'P1';";
    c += "              score = p1_win - p2_win;";
    c += "              winnerMsg += '  Player 1 Wins';";
    c += "          } else if (p2_win > p1_win) {";
    c += "              winner = 'P2';";
    c += "              score = p2_win - p1_win;";
    c += "              winnerMsg += '  Player 2 Wins';";
    c += "          } else {";
    c += "              winner = 'tie';";
    c += "              winnerMsg += '  Tie';";
    c += "          }";
    c += "          console.log(winnerMsg);";
    c += "          return {";
    c += "              message: winnerMsg,";
    c += "              winner: winner,";
    c += "              score: score";
    c += "          };";
    c += "      },";
    c += "      isOverEarly: function() {";
    c += "          return false;";
    c += "      }";
    c += "};";
    c += "return rtn;";
    codeStr = c;
        try {
            // eval (run) the code-string as code
            // and return the "result" (the last object)
            var obj = eval("(function() {"+codeStr+"})()");
//            console.log(obj);
            return obj;
        } catch (e) {
            console.log("contest_sandbox.EXCEPTION: "+e);
        }
};

