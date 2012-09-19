// mainHandler.js
//  MAIN APP: handle packets of data sent from child-apps

var logMsg = require('./log').log;
var packet = require('./packet');

// @TODO: override "log" to also include the "player" from the json object

var lastJSON = {};
var log = function(msg) {
    logMsg("Player:"+lastJSON.pn+" op:"+lastJSON.op+":"+msg);
};

// json = object from client
// stream = stdin for the client (way to send data back to client)
var process = function(json, stream) {
    lastJSON = json;
    log("process object from child-client:");
    log("...player="+json.pn);
    log("...op="+json.op);
    var data = json.data;
    switch(json.op) {
        case "submitTurn":
            log("TODO: process the turn here ...");
            packet.sendJson({op:"runNextTurn"}, stream);
            break;
        default:
            log("ERROR: unknown op("+json.op+")");
            break;
    }
};



exports.process = process;
