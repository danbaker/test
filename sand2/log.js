// log.js
//  append log strings to an existing file (log.txt)

var fs = require('fs');
var path = require('path');
var logfile = path.join(__dirname, "log.txt");
var prefix = "";

var log = function(msg) {
    var str = "" + (new Date().toString()) + ": "+prefix+": " + msg + "\n";
    if (fs.appendFileSync) {
        fs.appendFileSync(logfile, str);
    }
//    var id = fs.openSync(logfile, 'a');
//    fs.writeSync( id, str, 0, str.length, null);
//    fs.closeSync(id);
};

var setPrefix = function(str) {
    prefix = str;
    log("-- set prefix to:"+str);
};

var resetLogFile = function() {
    fs.unlinkSync(logfile);
    log("- - - - - - - NEW CONTEST STARTING - - - - - -");
};

exports.log = log;
exports.setPrefix = setPrefix;
exports.resetLogFile = resetLogFile;