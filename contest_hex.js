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
var hexBoard = require('./contestUtils/hexBoard');


var sand1;
var sand2;

var board_w = 15;
var board_h = 15;
var board;
var pnLost = undefined;         // "P1" or "P2" means that player did an invalid move, and lost
var pnWin = undefined;          // "P1" or "P2" means that player WON

// reset for a new contest between two bots, already loaded into sandboxes
exports.reset = function(s1, s2) {
    sand1 = s1;
    sand2 = s2;
    board = new hexBoard.HexBoard(board_w, board_h);
    board.fillBoard(function() { return ""; });
    pnLost = undefined;
    pnWin = undefined;
};

// return the options for this contest
exports.getOptions = function() {
    return {
        maxTurns: board_w * board_h / 2
        // ms allowed before killing a process that processes too long
    };
};

exports.submitTurn_p1 = function(json, sand, turnN) {
    return runTurnNow(json, sand, "P1");
};

exports.submitTurn_p2 = function(json, sand, turnN) {
    return runTurnNow(json, sand, "P2");
};

var runTurnNow = function(json, sand, pn) {
    // json.x, json.y = location to place my piece
    if (board.getCellAtPos(json)) {
        // oops ... cell already used
        pnLost = pn;
        return;
    }
    board.setCellAtPos(json, pn[1]);    // "1" or "2"
    checkWin(pn[1]);                    // check if this player just won
    return {
        pn: pn,
        x: json.x,
        y: json.y
    };
};
var checkWin = function(n) {
    for(var x=0; x<board_w; x++) {
        for(var y=0; y<board_h; y++) {
            if (checkWinSpot(x,y,n)) {
                pnWin = "P" + n;
                return;
            }
        }
    }
};
var checkWinSpot = function(x,y,n) {
    var pos = {x:x,y:y};
    var dirN;
    var n;
    if (board.getCellAtPos(pos) == n) {
        for(dirN=0; dirN<3; dirN++) {
            var dir = board.DIR_WEST + dirN;
            var nInRow = 1;
            for(n=0; n<6; n++) {
                board.movePosInDir(pos,dir);
                if (board.getCellAtPos(pos) == n) {
                    nInRow++;
                } else {
                    break;
                }
            }
            pos = {x:x,y:y};
            for(n=0; n<6; n++) {
                board.movePosInDir(pos,dir+3);
                if (board.getCellAtPos(pos) == n) {
                    nInRow++;
                } else {
                    break;
                }
            }
            if (nInRow >= 6) {
                return true;
            }
        }
    }
    // @TODO: check for circle around this cell
    nInRow = 0;
    for(dirN=0; dirN<6; dirN++) {
        pos = {x:x,y:y};
        board.movePosInDir(pos,board.DIR_WEST + dirN);
        if (board.getCellAtPos(pos) == n) nInRow++;
    }
    if (nInRow >= 6) {
        return true;
    }
};

exports.isOverEarly = function() {
    return (pnLost || pnWin);
};

exports.getResults = function() {
    if (pnLost) {
        return {
            message: "Player "+pnLost+" invalid move",
            winner: ""+(pnLost=="P1"? "P2" : "P1"),
            score: 1
        };
    }
    return {
        message: "Player "+pnWin+" Won",
        winner: ""+pnWin,
        score: 1
    };
};
