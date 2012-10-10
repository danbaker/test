// shovel.js
//  the code that is run in a separate process

// load up ALL needed files and global-acccess objects
var playerN = "0";
var lastJson = {};
var consoleX = console;         // NOTE: this will send data BACK to server (do NOT use it)
var processX = process;
require('./log').setPrefix("CHILD");
require('./logdb').setMaxLogs(100);         // only record first 100 logs per external bot code
var logX = require('./log').log;
var util = require( 'util' );
var path = require('path');
var fs = require('fs');
var packet = require('./packet');


var result;
var sandbox;
var stdin;              // stdin (data from main app)
var stdinStr = "";      // the string collected so far from stdin

var trace = function(msg) {
    log(msg);
};
var log = function(msg) {
//    logX("!!!Shovel."+playerN+"."+lastJson.op+": "+msg);
};

trace("loaded shovel.js");


// @TODO: rename this file "childapp.js"


var processPacket = function(pkt) {
    if (pkt.json) {
        lastJson = pkt.json;
        trace("processPacket.  op="+pkt.json.op+" playerN="+playerN);
        // got a json object
        switch(pkt.json.op) {
            case "prepareToStart":
                // server sends this message before the contest starts, allowing the bot to prepare
                log("calling contestAPI.prepareToStart ...");
                if (contestAPI && contestAPI.prepareToStart) {
                    contestAPI.prepareToStart();
                }
                break;
            case "runNextTurn":
                if (contestAPI && contestAPI.runNextTurn) {
                    log("calling contestAPI.runNextTurn ...");
                    contestAPI.runNextTurn();
                }
                break;
            case "sendAndReturn":
                // Note: data has returned from server (started from client. sent to server. returned from server to this client.)
                log("sendAndReturn (A) CAME BACK FROM SERVER");
                if (contestAPI && contestAPI.functionMap) {
                    log("sendAndReturn (B)");
                    var fncMap = contestAPI.functionMap;
                    var data = pkt.json.data;
                    var fncId = data.INTERNAL_fnc_id;
                    if (fncMap && fncMap[fncId]) {
                        log("sendAndReturn (C) --calling the return function within the users-bot code");
                        fncMap[fncId](data);
                        fncMap[fncId] = undefined;
                    }
                }
                break;
            case "setPlayer":
                playerN = pkt.json.pn;
                packet.setPlayerN(playerN);
                require('./log').setPrefix("CHILD["+playerN+"]");
                // require('./logdb').setMaxLogs(100);
                break;
            default:
                log("ERROR: unknown op")
        }
    } else if (pkt.str) {
        // got a simple string (for now, assume this is the actual code to run)
        var code = pkt.str;
        trace("loading running from within shovel");
        var runner = require('./runner');
        runner.runCode(code, process.stdout);
    }
};


// Get code passed in from main app
stdin = processX.openStdin();
stdin.on('data', function(data) {
    trace("stdin.on(data):  got data: "+data);
    stdinStr += data;
    for(var i=0; i<50 && stdinStr; i++) {
        var json = packet.checkStringForCompletePacket(stdinStr);
        stdinStr = json.str;
        if (json.packet) {
            trace("!! Got a packet: size="+json.packet.size+" :"+json.packet.str);
            processPacket(json.packet);
        } else {
            break;
        }
    }
});
stdin.on( 'end', function() {
    trace("got END on stdin");
    // shutdown when stdin is closed
});

// Note: the following code allows the shovel to stay running (I think)
var n = 0;
var waiting = function() {
    trace("entered waiting.  n="+n);
    if (n++ < 2) {
        setTimeout(function() {
            trace("waiting ... n="+n);
            waiting();
        }, 5000);
    }
};
