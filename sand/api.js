// NOTE: This file is loaded in to a separate context (a different "node" instance)
//          This file is loaded into each contest node instance
//          And loaded into the main node instance

var comm = require('./comm');

var thePlayer = "";           // "P1" or "P2" (which player THIS player is)

exports.get5 = function() { return 5; };
exports.get17 = function() { return 17; };
exports.getInfo = function() { return thePlayer; };


var trace = function(msg) {
    if (exports.debugLog) {
        exports.debugLog(""+thePlayer+": "+msg);
    } else {
        comm.log(""+thePlayer+": "+msg);
    }
};
exports.trace = trace;

// INTERNAL-USE-ONLY: we let ourselves know which player we are (P1 or P2)
exports.setPlayer = function(pn) {
    trace("setPlayer to "+pn);
    if (!thePlayer) {
        thePlayer = pn;
    }
};

// check if the contest is still running (no winner/loser yet)
var turnNumber = 1;
exports.isRunning = function() {
    trace("isRunning turnNumber="+turnNumber);
    turnNumber++;
    return turnNumber<100;
};

// wants to wait till it is players turn ... then call function
exports.waitForTurn = function(fnc) {
    trace("waitForTurn");
    comm.waitForTurn(thePlayer, fnc);
};

// the player is submitted it's turn data ... ready for machine to post-process the data
exports.submitTurn = function(data) {
    trace("submitTurn");
    comm.writeJson({did:thePlayer, now:thePlayer+"MB", data:data});
};

trace("api.js loaded");