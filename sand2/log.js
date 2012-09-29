// log.js
//  append log strings to an existing file (log.txt)
//
//
//  "logs" collection thoughts:
//  {
//      contest_id = NNN
//      user_id = NNN
//      logNumber = NNN  (incrementing number per log entry)
//      msg = "log message"
//  }
var mdbURL = process.env.MONGOLAB_URI;   // URL to THE database
var isLocal = (mdbURL? false : true);

var fs = require('fs');
var path = require('path');
var logdb = require('./logdb');
var logfile = path.join(__dirname, "log.txt");
var prefix = "";
var logN = 1;

var log = function(msg) {
    if (isLocal) {
        var str = "" + (new Date().toString()) + ": "+prefix+": " + msg + "\n";
        if (fs.appendFileSync) {
            fs.appendFileSync(logfile, str);
        }
    } else {
        // @TODO: ONLY record if:  CHILD[P1] or CHILD[P2]
        var doc = {};
        doc.date = "" + (new Date().toString());
        doc.prefix = prefix;
        doc.msg = msg;
        doc.logNumber = logN++;
        logdb.postLogs(doc);
    }
};

var setPrefix = function(str) {
    prefix = str;
    log("--  set prefix to:"+str);
};

var resetLogFile = function() {
    if (isLocal) {
        try {
            fs.unlinkSync(logfile);
        } catch (e) {
            // ignore error (assume file-not-found)
        }
        log("- - - - - - - NEW CONTEST STARTING - - - - - -");
    }
};

// get all log messages (by player#) -- return array of log messages
// return:  logs[0] = ["Player 1 log message 1", "log message 2" ... ]
//          logs[1] = ["Player 2 log message 1", "log message 2" ... ]
var getLogMessages = function(fnc) {
    if (isLocal) {
        var logMessages = [];
        logMessages[0] = [];
        logMessages[1] = [];
        // Fri Sep 28 2012 20:51:56 GMT-0600 (MDT): CHILD[P2]: USER_LOG:DANB calling submitTurn with pick=r
        // ----------------------------------------"CHILD[P" <number> "]: USER_LOG:"
        // Fri Sep 28 2012 20:51:56 GMT-0600 (MDT): DANB calling submitTurn with pick=r

        var input = fs.createReadStream(logfile);
        readLines(input, function(oneLine, isDone) {
            if (isDone) {
                fnc(logMessages);
            } else {
                var str1 = "CHILD[P";
                var str2 = "]: USER_LOG:";
                var idx1 = oneLine.indexOf(str1);
                var idx2 = oneLine.indexOf(str2);
                if (idx1>0 && idx2>0) {
                    try {
                        var pn = parseInt(oneLine.substr(idx1+str1.length, 1));
                        var msg = oneLine.substr(0, idx1) + oneLine.substr(idx2+str2.length);
                        if (pn >= 1 && pn <= 2) {
                            logMessages[pn-1] = msg;
                        }
                    } catch (e) {
                        // ignore error ... bad line ... ignore it
                    }
                }
            }
        });
    } else {
        fnc();
    }
};

// read an entire file, one line at a time
var readLines = function(input, func) {
    var remaining = '';

    input.on('data', function(data) {
        remaining += data;
        var index = remaining.indexOf('\n');
        var last  = 0;
        while (index > -1) {
            var line = remaining.substring(last, index);
            last = index + 1;
            func(line);
            index = remaining.indexOf('\n', last);
        }

        remaining = remaining.substring(last);
    });

    input.on('end', function() {
        if (remaining.length > 0) {
            func(remaining);
        }
        func(undefined, true);
    });
};


exports.log = log;
exports.setPrefix = setPrefix;
exports.resetLogFile = resetLogFile;
exports.getLogMessages = getLogMessages;