// shovel.js
//  the code that is run in a separate process


var util = require( 'util' );
var path = require('path');
var fs = require('fs');
var packet = require('./packet');
var log = require('./log').log;
require('./log').setPrefix("CHILD");

var code = '';          // jscode passed in
var result;
var consoleA = [];      // REMOVE THIS ... send console data back via stderr(?)
var sandbox;
var Script;
var stdin;

var trace = function(msg) {
    log(msg);
};

trace("loaded shovel.js");

// Get code passed in from main app
// @TODO: think about leaving stdin open ... and determining "end of data" some other way
stdin = process.openStdin();
stdin.on( 'data', function( data ) {
    trace("got data: "+data);
    code += data;
    var json = packet.checkStringForCompletePacket(code);
    code = json.str;
    if (json.packet) {
        trace("!! Got a packet: size="+json.packet.size+" :"+json.packet.str);
    }
});
stdin.on( 'end', function() {
    trace("got END on stdin");
    // shutdown when stdin is closed
});

var n = 0;
var waiting = function() {
    trace("entered waiting.  n="+n);
    if (n++ < 10) {
        setTimeout(function() {
            trace("waiting timeout fired.  n="+n);
            waiting();
        }, 100);
    }
};

var run2 = function() {
    trace("Inside of run2 ... sending packet back");
    packet.sendString("This is FROM child", process.stdout);
    waiting();
};
run2();



//function getSafeRunner() {
//    var global = this;
//    // Keep it outside of strict mode
//    function UserScript(str) {
//        // We want a global scoped function that has implicit returns.
//        return Function('return eval('+JSON.stringify(str+'')+')');
//    }
//    // place with a closure that is not exposed thanks to strict mode
//    return function run(commx, src) {
//        // stop argument / caller attacks
//        "use strict";
//        var send = function send(event) {
//            "use strict";
//            //
//            // All comm must be serialized properly to avoid attacks, JSON or XJSON
//            //
//            commx.send(event, JSON.stringify([].slice.call(arguments,1)));
//        };
//        global.print = send.bind(global, 'stdout');
//        global.console = {};
//        global.console.log = send.bind(global, 'stdout');
//        var result = UserScript(src)();
//        send('end', result);
//        // @TODO: allow js to continue running ???
//        setTimeout( function() {
//            send('end', result);
//        }, 3000 );
//    }
//}

// Run code
//function run() {
//    var context = Script.createContext();
//    // alter the context of the script ... add contest-api to it
//    context.contestAPI = api;
//    context.contestAPI.debugLog = function(msg) { consoleA.push(msg); };
//
//    var safeRunner = Script.runInContext('('+getSafeRunner.toString()+')()', context);
//    var result;
//    try {
//        safeRunner({
//            send: function (event, value) {
//                "use strict";
//                switch (event) {
//                    case 'stdout':
//                        consoleA.push(value); // DANB NOTE: this works (I don't know if it is safe)
////            consoleA.push.apply(consoleA, JSON.parse(value).slice(1));
//                        break;
//                    case 'end':
//                        result = JSON.parse(value)[0];
//                        break;
//                }
//            }
//        }, code);
//    }
//    catch (e) {
//        result = "EXCEPTION: " + e.name + ': ' + e.message;
//    }
//    // @TODO: WAIT until all js has finished before being done
//    consoleA.push("safeRunner returned");
//    setTimeout( function() {
//        consoleA.push("about to send the data back, and exit");
//        process.stdout.on( 'drain', function() {
//            process.exit(0)
//        });
//        process.stdout.write( JSON.stringify( { result: util.inspect( result ), console: consoleA } ) );
//    }, 3000 );
//
//
//}

