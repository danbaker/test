// shovel.js - Do the heavy lifting in this sandbox
// Gianni Chiappetta - gf3.ca - 2010

/* ------------------------------ INIT ------------------------------ */
var util = require( 'util' )
  , code
  , result
  , consoleA
  , sandbox
  , Script
  , stdin
  , api = require('./api')          // API back to the contest
  , path = require('path')
  , fs = require('fs')
    ;


if ( ! ( Script = process.binding( 'evals').NodeScript ) )
  if ( ! ( Script = process.binding('evals').Script ) )
    Script = require( 'vm' );

/* ------------------------------ Sandbox ------------------------------ */
consoleA = [];

// Get code
code = '';
stdin = process.openStdin();
stdin.on( 'data', function( data ) {
  code += data;
});
stdin.on( 'end', function() {
    consoleA.push("about to call run");
    run();
    consoleA.push("returned from run");
});


function getSafeRunner() {
  var global = this;
  // Keep it outside of strict mode
  function UserScript(str) {
    // We want a global scoped function that has implicit returns.
    return Function('return eval('+JSON.stringify(str+'')+')');
  }
  // place with a closure that is not exposed thanks to strict mode
  return function run(commx, src) {
    // stop argument / caller attacks
    "use strict";
    var send = function send(event) {
      "use strict";
      //
      // All comm must be serialized properly to avoid attacks, JSON or XJSON
      //
      commx.send(event, JSON.stringify([].slice.call(arguments,1)));
    };
    global.print = send.bind(global, 'stdout');
    global.console = {};
    global.console.log = send.bind(global, 'stdout');
    var result = UserScript(src)();
    send('end', result);
      // @TODO: allow js to continue running ???
      setTimeout( function() {
          send('end', result);
      }, 3000 );
  }
}

// Run code
function run() {
  var context = Script.createContext();
  // alter the context of the script ... add contest-api to it
  context.contestAPI = api;
  context.contestAPI.debugLog = function(msg) { consoleA.push(msg); };

  var safeRunner = Script.runInContext('('+getSafeRunner.toString()+')()', context);
  var result;
  try {
    safeRunner({
      send: function (event, value) {
        "use strict";
        switch (event) {
          case 'stdout':
              consoleA.push(value); // DANB NOTE: this works (I don't know if it is safe)
//            consoleA.push.apply(consoleA, JSON.parse(value).slice(1));
            break;
          case 'end':
            result = JSON.parse(value)[0];
            break;
        }
      }
    }, code);
  }
  catch (e) {
    result = "EXCEPTION: " + e.name + ': ' + e.message;
  }
    // @TODO: WAIT until all js has finished before being done
    consoleA.push("safeRunner returned");
    setTimeout( function() {
        consoleA.push("about to send the data back, and exit");
        process.stdout.on( 'drain', function() {
            process.exit(0)
        });
        process.stdout.write( JSON.stringify( { result: util.inspect( result ), console: consoleA } ) );
    }, 3000 );


}

