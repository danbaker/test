// mainHandler.js
//  MAIN APP: handle packets of data sent from child-apps

var logMsg = require('./log').log;

// @TODO: override "log" to also include the "player" from the json object

var lastJSON = {};
var log = function(msg) {
    logMsg("Player:"+lastJSON.pn+" op:"+lastJSON.op+":"+msg);
};

var process = function(json) {
    lastJSON = json;
    log("process object from child-client:");
    log("...player="+json.pn);
    log("...op="+json.op);
    var data = json.data;
    switch(json.op) {
        case "submitTurn":
            log("TODO: process the turn here ...");
            break;
        default:
            log("ERROR: unknown op("+json.op+")");
            break;
    }
};



exports.process = process;
