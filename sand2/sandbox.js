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
var mainHandler = require('./mainHandler');
var logX = require('./log').log;
var log = function(msg, pn) {
    logX("sandbox."+pn+": "+msg);
};


// main constructor for creating a sandbox
function Sandbox(options) {
    (this.options = options || {}).__proto__ = Sandbox.options;

    var childStdin;
    var self = this;
    var playerN = "0";


    // return the stream to send packet data to for this child-sandbox-app
    this.getStream = function() {
        return childStdin;
    };

    // DEBUG-ONLY !!!
    this.getPlayerN = function() {
        return playerN;
    };


    this.run = function(pn, jscode, fnc) {
        playerN = pn;
        log("Sandbox.run -- starting", playerN);
        var timer;
        var stdoutTxt = '';
        var child = spawn( this.options.node, [this.options.shovel] );
        var fnStdout = function(data) {
            if (!!data) {
                stdoutTxt += data;
                for(var i=0; i<50 && stdoutTxt; i++) {
                    var json = packet.checkStringForCompletePacket(stdoutTxt);
                    stdoutTxt = json.str;
                    if (json.packet) {
                        if (json.packet.json) {
                            mainHandler.process(json.packet.json, child.stdin, self);
                        } else if (json.packet.str) {
                            // ??
                            break;
                        } else {
                            // ??
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }
        };

        childStdin = child.stdin;

        // 3rd party code send some data back via stdout
        child.stdout.on( 'data', fnStdout);

        // wait for 3rd party to exit
        child.on( 'exit', function( code ) {
            log("got an EXIT from child", playerN);
            clearTimeout( timer );
//            fnc.call( this, JSON.parse( stdoutTxt ) );
            fnc.call( this, {} );
        });

        // send the javascript code TO the new node process as a packet
        log("sending setPlayer="+playerN, playerN);
        packet.sendJson({op:"setPlayer", pn:playerN}, child.stdin);
        log("sending: "+jscode, playerN);
        packet.sendString(jscode, child.stdin);

        // set up a timeout timer (if node process runs too long, just kill it)
        timer = setTimeout( function() {
            log("TIMEOUT --- kill child process NOW", playerN);
            child.stdout.removeListener( 'output', fnStdout );
            child.stdin.end();
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
