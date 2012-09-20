// mainHandler.js
//  MAIN APP: handle packets of data sent from child-apps

var logMsg = require('./log').log;
var packet = require('./packet');


var lastJSON = {};
var log = function(msg) {
    logMsg("Player:"+lastJSON.pn+" op:"+lastJSON.op+" --- "+msg);
};

// json = object from client
// stream = stdin for the client (way to send data back to client)
var process = function(json, stream) {
    lastJSON = json;
    var data = json.data;
    switch(json.op) {
        case "submitTurn":
            log("TODO: ask the OTHER player to runNextTurn");
            packet.sendJson({op:"runNextTurn"}, stream);
            break;
        default:
            log("ERROR: unknown op("+json.op+")");
            break;
    }
};



exports.process = process;
