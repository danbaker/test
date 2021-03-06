// runner.js
//  a calm place to run 3rd party code in
//  NOTE: This runs in the sandboxed external node.js process
// usage:
//  var runner = require('runner');
//  runner.runCode(code);

// variables that the client-code has access to
contestAPI = {};
console = {};

(function(){
    // hidden variables
    var packet = require('./packet');
    var log = require('./log').log;
    var logDoc = require('./log').logDoc;
    var playerN = "P0";                                     // "P1" or "P2"å
    var pinfo = undefined;                                  // { contest_id, bot_id, user_id, run_id, pn }
    var fncMap = {};
    var fncMapId = 1;

    // client code calls this to set their own player# (NOTE: can only call this ONCE)
    contestAPI.setPlayer = function(pinfoX) {
        //log("runner.setPlayer for "+pinfoX.pn);
        if (pinfoX && !pinfo) {
            pinfo = pinfoX;
            playerN = pinfo.pn;
            // inform server that "setPlayer" was called -- meaning this bot is "up and running"
            packet.sendJson({op:"upAndRunning", pn:playerN});
        }
    };
    // client code calls this to indicate they have finished preparing, and are ready to have the contest start
    contestAPI.submitReadyToStart = function() {
        //log("runner.submitReadyToStart");
        packet.sendJson({op:"submitReadyToStart", pn:playerN});
    };
    // client code calls this to submit their turn data
    contestAPI.submitTurn = function(json) {
        //log("runner.submitTurn for "+pinfo.pn);
        packet.sendJson({op:"submitTurn", pn:playerN, data:json});
    };
    contestAPI.functionMap = fncMap;
    contestAPI.queryRuns = function(json, fnc) {
        console.log("queryRun - from client, sending to server");
        json.INTERNAL_fnc_id = fncMapId;
        fncMap[fncMapId] = fnc;
        fncMapId++;
        packet.sendJson({op:"sendAndReturn", subop:"queryRuns", pn:playerN, data:json});
    };
    contestAPI.sendAndReturn = function(json, fnc) {
        console.log("sendAndReturn - from client, sending to server");
        json.INTERNAL_fnc_id = fncMapId;
        fncMap[fncMapId] = fnc;
        fncMapId++;
        packet.sendJson({op:"sendAndReturn", subop:"queryRuns", pn:playerN, data:json});
    };
    // client calls this to log
    console.log = function(msg) {
        var doc = {};
        doc.msg = msg;
//        // copy entire player-info object into log document
//        if (pinfo) {
//            for(var key in pinfo) {
//                if (pinfo.hasOwnProperty(key)) {
//                    doc[key] = pinfo[key];
//                }
//            }
//        }
        if (pinfo) {
            doc.pn = pinfo.pn;
            doc.bot_id = pinfo.bot_id;
            doc.user_id = pinfo.user_id;
            doc.run_id = pinfo.run_id;
            doc.contest_id = pinfo.contest_id;
        }
        logDoc(doc);
    };
}());



// the one-and-only function in this file
exports.runCode = function(codeStr, stream)
{
    var packet = require('./packet');
    packet.setStream(stream);
    packet = undefined;

    (function() {
        try {
            var fnc = Function('return eval('+JSON.stringify(codeStr+'')+')');

            // note: redefine all known globals ... so client-code can't access them
            var global = undefined;
            var GLOBAL = undefined;
            var root = undefined;
            var process = undefined;
            var require = undefined;
            fnc();
        } catch (e) {
            console.log("EXCEPTION: "+e);
        }
    }());
};
