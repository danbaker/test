
// // // // // // // // // // // // //
//
//      COMMUNICATION ROUTINES

var path = require('path');
var fs = require('fs');
var api = require('./api');

var thefile = path.join(__dirname, "commfile.txt");
var logfile = path.join(__dirname, "commlog.txt");


var trace = function(msg) {
    if (api.debugLog) {
        api.debugLog(msg);
    }
    log(msg);
};

//var fileExist = function(filename, fnc) {
//    fs.stat(filename, function(err, stat) {
//        if (!err) {
//            fnc(true);      // file EXISTS
//        } else {
//            fnc(false);     // file does NOT exist
//        }
//    });
//};

var writeJson = function(json, fnc) {
    var str = JSON.stringify(json);
    trace("writeJson: "+str);
    fs.writeFile(thefile, str, function(err) {
        if(err) {
            fnc(false);
        } else {
            fnc(true);
        }
    });
};
var readJson = function(fnc) {
    fs.readFile(thefile, function(err,data) {
        if (err) {
            trace("readJson FAILED");
            fnc();
        } else {
            trace("readJson: '"+data+"'");
            if (data && data.length) {
                try {
                    var json = JSON.parse(data);
                    fnc(json);
                } catch (e) {
                    trace("readJson: THREW EXCEPTION:"+e.toString());
                    fnc({});
                }
            } else {
                fnc({});
            }
        }
    });
};


var watch = function(fnc) {
    trace("watch");
    fs.watchFile(thefile, { persistent: false, interval: 50 }, function(curr, prev) {
        // curr.mtime = file current time
        // prev.mtime = file previous time
        fnc();
    });
};
var unwatch = function(fnc) {
    trace("unwatch");
    fs.unwatchFile(thefile);
    if (fnc) fnc();
};

// check if "Player PN" is suppose to run now
// callback with:  true means YES, false means NO
var checkTurn = function(pn, fnc) {
    readJson(function(json) {
        if (json && (json.now === pn || json.done)) {
            // either players turn OR game over
            fnc(true);
        } else {
            fnc(false);
        }
    });
};
var waitForTurn = function(pn, fnc) {
    // @TODO: add in a timeout (like N seconds) ... call fnc(false) on timeout
    watch(function() {
        unwatch();
        checkTurn(pn, function(yes) {
            if (yes) {
                // "Player PN turn is NOW" (ignore IF already ran the function)
                if (fnc) {
                    fnc();
                    fnc = undefined;
                }
            } else {
                // "NOT Player PN turn right now"
                if (fnc) {
                    waitForTurn(pn, fnc);
                }
            }
        });
    });
    checkTurn(pn, function(yes) {
        if (yes && fnc) {
            fnc();
            fnc = undefined;
        }
    });
};

var log = function(msg) {
    var str = "" + (new Date().toString()) + ": " + msg + "\n";

//    fs.writeFile(logfile, str);

//    fs.open(logfile, 'a', 666, function( e, fd ) {
//        fs.write( fd, str, 0, str.length, null, function(){
//            fs.close(fd, function(){
//            });
//        });
//    });

    var s = fs.createWriteStream(logfile, {'flags': 'a'});
    s.write(str);
    s.end();
    s.destroySoon();
};
var resetLog = function() {
    fs.writeFile(logfile, "");
    log("JUST RESET LOG FILE");
};
log("JUST LOADED COMM.JS");

exports.writeJson = writeJson;
exports.checkTurn = checkTurn;
exports.waitForTurn = waitForTurn;
exports.log = log;
exports.resetLog = resetLog;



