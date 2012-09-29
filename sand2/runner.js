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
    var pinfo = {};                                         // { contest_id, bot_id, user_id, run_id, pn }
    // client code calls this to set their own player#
    contestAPI.setPlayer = function(pinfoX) {
        if (pinfo) {
            pinfo = pinfoX;
            playerN = pinfo.pn;
        }
    };
    // client code calls this to submit their turn data
    contestAPI.submitTurn = function(json) {
        packet.sendJson({op:"submitTurn", pn:playerN, data:json});
    };
    // client calls this to log
    console.log = function(msg) {
        var doc = {};
        doc.msg = msg;
        // copy entire player-info object into log document
        for(var key in pinfo) {
            if (pinfo.hasOwnProperty(key)) {
                doc[key] = pinfo[key];
            }
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
