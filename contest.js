/*

    CONTEST

*/
var Sandbox = require('./sand/sandbox');

// run a contest between P1 and P2 (call callback fnc when done)
exports.runContest = function(id_p1, id_p2, fnc) {
    var s = new Sandbox();
    var js = "var x = 5; console.log(x * x); x";
    s.run( js, function( output ) {
        // output.result = returned value
        // output.console = returned console logs (doesn't seem to work on heroku)
        fnc(output);
//        console.log( "Example 10: " + output.console + "\n" )
    });
//    fnc({note:"Not implemented yet"});
};