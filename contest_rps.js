// contest_rps.js
//  Contest:        Rock-Paper-Scissors
//
//  interface items MUST export:
//      exports.reset(sand1, sand2);                // resets all data for a new contest between two sandboxes (sand1, sand2)
//      exports.getOptions()                        // return the known contest-options for this contest
//      exports.submitTurn_p1(json, sand, nTurn);   // submit a turn to run for sandbox on turn N for player#PN (1=player 1)
//      exports.submitTurn_p2(json, sand, nTurn);   // submit a turn to run for sandbox on turn N for player#PN (1=player 1)
//      exports.getResults()                        // return the info when contest is over
//          {
//              message: "Player1 won 3 times.  Player2 won 2 times.  Player 1 wins."
//              winner: "P1"                    // "P1", "P2", "tie"
//              score: 1                        // some way to represent the score the winner gets
//          }
//  Optional:
//      exports.isOverEarly();                      // returns true IFF contest has ended early (before all turns are over)
//
//

var sand1;
var sand2;
var p1_win;
var p2_win;
var tie_win;
// --- internal-use only
var turnN;

exports.reset = function(s1, s2) {
    sand1 = s1;
    sand2 = s2;
    p1_win = 0;
    p2_win = 0;
    tie_win = 0;
};

exports.getOptions = function() {
    return {
        maxTurns: 7
        // ms allowed before killing a process that processes too long
    };
};

exports.submitTurn_p1 = function(json, sand, turnN) {
    sand.savedTurn = json;
};

exports.submitTurn_p2 = function(json, sand, turnN) {
    sand.savedTurn = json;
    runTurnNow(turnN);
};

var runTurnNow = function(turnNumber) {
    turnN = turnNumber;
    var p1 = sand1.savedTurn.pick;
    var p2 = sand2.savedTurn.pick;
    if ((p1 == 'r' && p2 == 's') || (p1 == 'p' && p2 == 'r') || (p1 == 's' && p2 == 'p')) {
        p1_win++;
    } else  if ((p2 == 'r' && p1 == 's') || (p2 == 'p' && p1 == 'r') || (p2 == 's' && p1 == 'p')) {
        p2_win++;
    } else {
        tie_win++;
    }
    //log("p1="+p1+"  p2="+p2+"  p1Win="+p1Win+"  p2Win="+p2Win);
};

exports.isOverEarly = function() {
    // if either player gets over half the turns, instantly wins
    var halfTurns = exports.getOptions().maxTurns / 2;
    return p1_win > halfTurns || p2_win > halfTurns;
};

exports.getResults = function() {
    var winner = "tie";         // "tie" or "P1" or "P2"
    var score = 0;
    var winnerMsg;              // "Player 1 won 5 times. Player 2 won 2 times. Tied 3 times"
    winnerMsg = "Player 1 won "+p1_win+" times.  Player 2 won "+p2_win+" times.";
    if (p1_win > p2_win) {
        console.log("CONTEST OVER: Player1 WIN P1("+p1_win+") to P2("+p2_win+")");
        winner = "P1";
        score = p1_win - p2_win;
        winnerMsg += "  Player 1 Wins";
    } else if (p2_win > p1_win) {
        console.log("CONTEST OVER: Player2 WIN P1("+p1_win+") to P2("+p2_win+")");
        winner = "P2";
        score = p2_win - p1_win;
        winnerMsg += "  Player 2 Wins";
    } else {
        console.log("CONTEST OVER: TIE P1("+p1_win+") to P2("+p2_win+")");
        winner = "tie";
        winnerMsg += "  Tie";
    }
    console.log(winnerMsg);

    return {
        message: winnerMsg,
        winner: winner,
        score: score
    };
};
