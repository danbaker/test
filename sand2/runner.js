// runner.js
//  a calm place to run 3rd party code in
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
    var playerN = 0;
    // client code calls this to set their own player#
    contestAPI.setPlayer = function(pn) {
        playerN = pn;
    };
    // client code calls this to submit their turn data
    contestAPI.submitTurn = function(json) {
        packet.sendJson({op:"submitTurn", pn:playerN, data:json});
    };
    // client calls this to log
    console.log = function(msg) {
        log("USER_LOG:"+msg);
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
