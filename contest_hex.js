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
//



var sand1;
var sand2;

var board_w = 20;
var board_h = 20;
var board;

// reset for a new contest between two bots, already loaded into sandboxes
exports.reset = function(s1, s2) {
    sand1 = s1;
    sand2 = s2;
    board = [];
    for(var y=0; y<board_h; y++) {
        board[y] = [];
        for(var x=0; x<board_w; x++) {
            board[y][x] = " ";
        }
    }
};

// return the options for this contest
exports.getOptions = function() {
    return {
        maxTurns: board_w * board_h
        // ms allowed before killing a process that processes too long
    };
};

exports.submitTurn_p1 = function(json, sand, turnN) {
    return runTurnNow(json, sand, "X");
};

exports.submitTurn_p2 = function(json, sand, turnN) {
    return runTurnNow(json, sand, "O");
};

var runTurnNow = function(json, sand) {
    // json.x, json.y = location to place my piece
    return {
    };
};

exports.isOverEarly = function() {
    return false;
};

exports.getResults = function() {
    return {
        message: "unknown winner",
        winner: "tie",
        score: 0
    };
};
