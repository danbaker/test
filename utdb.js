
var pg = require('pg');
var nhash = require('node_hash');

var theClient = undefined;              // the database-client-connection object
var onReadyFncs = [];


// function to call to log console messages
var traceFunction = function(msg) {
    console.log(msg);
};
// function to call to NOT log message to console
var nillFunction = function() {
};
var trace = traceFunction;

// function to run when database is ready to use
var doOnReadyNow = function() {
    if (theClient) {
        process.nextTick(function() {
            for(var i=0; i<onReadyFncs.length; i++) {
                onReadyFncs[i]();
            }
            onReadyFncs = [];
        });
    }
};

// establish THE connection to THE database
pg.connect(process.env.DATABASE_URL, function(err, client) {
    if (err) {
        trace("database connection error: "+err);
    } else {
        var query;
        //    var query = client.query('SELECT * FROM your_table');
        //
        //    query.on('row', function(row) {
        //        trace(JSON.stringify(row));
        //    });

//        query = client.query("DROP TABLE users");
//        query.on('end', function() {
//            // table created OR failed
//            trace("connect: 2");
//            query = client.query('CREATE TABLE users (id SERIAL PRIMARY KEY, uname varchar(20) NOT NULL UNIQUE, upw varchar(40) NOT NULL)');
//            query.on('end', function() {
//                // table created OR failed
//                trace("connect: 3");
                theClient = client;
                doOnReadyNow();
//            }).on('error', function(err) {
//                    trace("connect: create table error: %j", err);
//                });
//        }).on('error', function(err) {
//                trace("connect: drop table error: %j", err);
//        });

//        trace("3");
//        query = client.query('INSERT INTO users(uname,upw) VALUES($1,$2)', ["danb", "secret"]);
//        query.on('end', function() {
//            // table created OR failed
//            trace("2");
//        });
//        console.log("4");
//        query = client.query('SELECT * FROM users');
//        query.on('row', function(result) {
//            if (!result) {
//                trace("nothing selected.  boo hoo");
//            } else {
////                debug_text += "id:"+result.id+" uname:"+result.uname+" upw:"+result.upw+"<br>";
//                trace("%j", result);
//            }
//        });

        // save the client-connection-object (allowing others to operate on the database)
        // call all "onReady" functions
    }
});


// encrypt (hash) a password
var encryptPW = function(pw, user) {
    var h = nhash.md5(pw);
    var salt;
    var fnc;
    var nTimes = 50+pw.length*3+user.length*7;
    for(var n=nTimes; n>0; n--) {
        salt = undefined;
        // Note: the last 7 iteration, just hash the previous hash (w/o adding in the original user/pw)
        if (n > 7) {
            switch (n % 7) {
                case 0:  h += user; break;
                case 1:  h = user + h; break;
                default: salt = user; break;
                case 3:  h += pw; break;
                case 4:  h = pw + h; break;
                case 5:  salt = pw; break;
                case 6:  salt = "UtahJSisBeyondAwesomeInTheYear2012";
            }
        }
        switch (n % 3) {
            default: fnc = nhash.md5; break;
            case 1:  fnc = nhash.sha1; break;
            case 2:  fnc = nhash.sha256; break;
        }
        for(var i=0; i<n/3+2+pw.length+user.length; i++) {
            h = fnc(h, salt);
        }
    }
    // shrink it down, one last time
    h = nhash.md5(h);
    return h;
};

// check if the database has been connected to, and is ready to use
// return: true IF the database is ready to use
exports.isReady = function() {
    return !!theClient;
};

// return the database-client-connection object
exports.getClient = function() {
    return theClient;
};

// find a user in the user table
exports.findUser = function(name,pw,fnc) {
    trace("findUser u="+name+" pw="+pw);

    if (theClient) {
        trace("findUser 1");
        pw = encryptPW(pw, name);
        trace("findUser 2:  name="+name+"  epw="+pw);
        var fncCalled = false;
        var query = theClient.query("SELECT id FROM users WHERE uname=$1 AND upw=$2", [name,pw]);
        trace("findUser 3: query=%j",query);
        query.on('row', function(result) {
                trace("findUser: got a row:  %j",result);
                if (result) {
                    fncCalled = true;
                    fnc(result);
                }
            }).on('end', function() {
                trace("findUser: on END");
                if (!fncCalled) {
                    fncCalled = true;
                    fnc(undefined);
                }
            }).on('error', function(err) {
                trace("findUser: ERROR %j", err);
                if (!fncCalled) {
                    fncCalled = true;
                    fnc(undefined);
                }
            });
        trace("findUser: 4");
    } else {
        if (!fncCalled) {
            fncCalled = true;
            fnc(undefined);
        }
    }
    trace("findUser: 5");
};

// add a new user to the system
exports.addUser = function(name, pw, fnc) {
    trace("addUser: u="+name+"  pw="+pw);
    if (theClient) {
        pw = encryptPW(pw, name);
        var query = theClient.query('INSERT INTO users(uname,upw) VALUES($1,$2)', [name,pw]);
        trace("addUser: query=%j", query);
        query.on('end', function() {
                // user inserted OK
                trace("addUser: on END");
                if (fnc) fnc(true);
                fnc = undefined;
            }).on('error', function(err) {
                trace("addUser: ERROR %j", err);
                if (fnc) fnc();
            });
    }
};

exports.onReady = function(fnc) {
    if (exports.isReady()) {
        process.nextTick(fnc);
    } else {
        onReadyFncs.push(fnc);
    }
};

// allow testing of the encrypt function
exports.testencryptPW = encryptPW;