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
    contestAPI.setPlayer = function(pn) {
        console.log("API.setPlayer()");
    };
    contestAPI.submitTurn = function(json) {
        console.log("API.submitTurn");
        packet.sendJson(json);
    };
    console.log = function(msg) {
        log("CODE:"+msg);
    };
}());



// the one-and-only function in this file
exports.runCode = function(codeStr, stream)
{
    console.log("About to run client JavaScript:"+codeStr);
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
            console.log("going to call fnc");
            fnc();
        } catch (e) {
            console.log("EXCEPTION: "+e);
        }
    }());
};
