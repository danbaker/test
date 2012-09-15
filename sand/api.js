

// NOTE: This file is loaded in to a separate context (a different "node" instance)
var path = require('path');
var fs = require('fs');
var thePlayer = "P?";           // "P1" or "P2" (which player THIS player is)

exports.get5 = function() { return 5; };
exports.get17 = function() { return 17; };
exports.getInfo = function() { return thePlayer; };
exports.setPlayer = function(pn) {
    thePlayer = pn;
};



// // // // // // // // // // // // //
//
//      COMMUNICATION ROUTINES
var thefile = path.join(__dirname, "commfile.txt");

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
            fnc();
        } else {
            fnc(JSON.parse(data));
        }
    });
};


var watch = function(fnc) {
    fs.watchFile(thefile, { persistent: false, interval: 50 }, function(curr, prev) {
        // curr.mtime = file current time
        // prev.mtime = file previous time
        fnc();
    });
};
var unwatch = function(fnc) {
    fs.unwatch(thefile);
    fnc();
};


//writeJson({a:1,b:"Yes!"}, function(ok) {
//    console.log("File written");
//    watch(thefile, function() {
//        console.log("THEfile changed:");
//        unwatch(function() {
//            readJson(function(obj) {
//                console.log(obj);
//            });
//        });
//    });
//});

// force player PN to "startup"
exports.forceToPlayer = function(pn, fnc) {
    writeJson({player:pn}, fnc);
};

// watch for the file to change ... callback when the file changes
exports.watch = function(fnc) {
    watch(function() {
        unwatch(fnc);
    });
};
