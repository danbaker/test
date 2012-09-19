// sandbox.js
//  main entry point for running 3rd-party JavaScript in a safe sandbox (aka another process)
//  this allows for timeout of the JavaScript
//  this allows for the 3rd party to run async calls (to databases and disk)
// USAGE:
//  var Sandbox = require('sandbox');
//  var s = new Sandbox({options});
//  s.run(js, {
//      stdout: function(data) { ... },     // 3rd party code sending data back (like a request)
//      stderr: function(data) { ... },     // 3rd party code sending log info back
//  });
//  s.<some way of sending data TO the sandbox code>


var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var packet = require('./packet');
var log = require('./log').log;
var mainHandler = require('./mainHandler');


// main constructor for creating a sandbox
function Sandbox(options) {
    (this.options = options || {}).__proto__ = Sandbox.options;

    this.run = function(jscode, fnc) {
        log("Sandbox.run -- starting");
        var timer;
        var stdoutTxt = '';
        var child = spawn( this.options.node, [this.options.shovel] );
        var fnStdout = function(data) {
            if (!!data) {
                stdoutTxt += data;
                var json = packet.checkStringForCompletePacket(stdoutTxt);
                stdoutTxt = json.str;
                if (json.packet) {
                    if (json.packet.json) {
                        log("GOT An OBJECT FROM THE CHILD:"+JSON.stringify(json.packet.json));
                        mainHandler.process(json.packet.json);
                    } else if (json.packet.str) {
                        log("GOT A STRING FROM THE CHILD:"+json.packet.str);
                    }
                }
            }
        };

        // 3rd party code send some data back via stdout
        child.stdout.on( 'data', fnStdout);

        // wait for 3rd party to exit
        child.on( 'exit', function( code ) {
            log("got an EXIT from child");
            clearTimeout( timer );
//            fnc.call( this, JSON.parse( stdoutTxt ) );
            fnc.call( this, {} );
        });

        // send the javascript code TO the new node process as a packet

        log("sending: "+jscode);
        packet.sendString(jscode, child.stdin);
//        child.stdin.write(jscode);
// @TODO: think about leaving stdin open ... and determining "end of data" some other way
//        child.stdin.end();

        // set up a timeout timer (if node process runs too long, just kill it)
        timer = setTimeout( function() {
            child.stdout.removeListener( 'output', fnStdout );
            stdoutTxt = JSON.stringify( { result: 'TimeoutError', console: [] } );
            child.kill( 'SIGKILL' );
        }, this.options.timeout );

    }
}

// static options
Sandbox.options =
{
    timeout: 5000,           // allow player code to run N seconds
    node: 'node',           // using node as the external app
    shovel: path.join( __dirname, 'shovel.js' )
};


module.exports = Sandbox;

