/*
    TABLE:  users
    COLUMNS:
        id      // auto assigned integer
                // is used as the "id" for this user (stored in the session)
        uname   // string -- the username (email adddress)
        upw     // string -- the users password (encrypted)
        auth    // int -- the authorization level for this user (set bits mean special authorizations)
            0    = default auth. "normal" user (has no special authorization)
            01   =
            02   =
            04   =
            08   =
            10   =
            20   =
            40   =
            80   = can change auth values for all users
            FF   = super-user (can do ANYTHING)
 */



var dbURL = process.env.DATABASE_URL;   // URL to THE database (on Heroku)
var isLocal = (dbURL? false : true);


var pg;
if (!isLocal) pg = require('pg');
var nhash = require('node_hash');

var theClient = undefined;              // the database-client-connection object
var onReadyFncs = [];


// function to call to NOT log message to console
var nillFunction = function() {
};
var trace;
trace = console.log;                // report all trace messages to console
trace = nillFunction;             // ignore all trace messages

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

if (isLocal) {
    // SIMULATE like we have a database
    console.log("LOCAL TESTING.  NO DATABASE.");
    process.nextTick(function() {
        process.nextTick(function() {
            for(var i=0; i<onReadyFncs.length; i++) {
                onReadyFncs[i]();
            }
            onReadyFncs = [];
        });
    });
} else {
// establish THE connection to THE database
pg.connect(process.env.DATABASE_URL, function(err, client) {
    if (err) {
        console.log("database connection error: "+err);
    } else {
        // NOTE: DO HERE: Handle database migration here ...
        var query;

        query = client.query('CREATE TABLE users (id SERIAL PRIMARY KEY, uname varchar(20) NOT NULL UNIQUE, upw varchar(40) NOT NULL, auth SMALLINT NOT NULL)');
        query.on('end', function() {
                // if didn't fail, then create happened

            }).on('error', function(err) {
                // failed to create table (already existed?)
                query = client.query('ALTER TABLE users ADD COLUMN auth SMALLINT NOT NULL DEFAULT 0');
                query.on('end', function() {

                    }).on('error', function(err) {

                    });
            });
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
}


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
getClient = function() {
    if (theClient) {
        if (theClient.connection && theClient.connection.stream && theClient.connection.stream.destroyed) {
            // NOTE: Playing with this is confusing.  destroyed is set to true sometimes, but magically re-connects
//            theClient = undefined;
//            pg.connect(process.env.DATABASE_URL, function(err, client) {
//                if (err) {
//                    console.log("database connection error: "+err);
//                } else {
//                    theClient = client;
//                }
//            });
        }
    }
    return theClient;
};
exports.getClient = getClient;

// find a user in the user table
exports.findUser = function(name,pw,fnc) {
    trace("findUser u="+name+" pw="+pw);

    if (theClient) {
        trace("findUser 1");
        pw = encryptPW(pw, name);
        trace("findUser 2:  name="+name+"  epw="+pw);
        var fncCalled = false;
        var query = getClient().query("SELECT id FROM users WHERE uname=$1 AND upw=$2", [name,pw]);
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
exports.addUser = function(name, opw, fnc) {
    trace("addUser: u="+name+"  pw="+opw);
    if (theClient) {
        var epw = encryptPW(opw, name);
        var query = getClient().query('INSERT INTO users(uname,upw) VALUES($1,$2)', [name,epw]);
        trace("addUser: query=%j", query);
        query.on('end', function() {
                // user inserted OK
                trace("addUser: on END");
                if (fnc) {
                    // return the user's result (result.id)
                    exports.findUser(name, opw, fnc);
                }
                fnc = undefined;
            }).on('error', function(err) {
                trace("addUser: ERROR %j", err);
                if (fnc) fnc();
            });
    }
};

exports.dumpAllUsers = function() {
    if (theClient) {
        console.log("_handle="+theClient.connection.stream._handle);
        console.log("destroyed="+theClient.connection.stream.destroyed);
//        console.log("theClient: v v v v v v v v v v v v v v v v v v v v");
//        console.log(theClient);
        var n = 0;
        var query = getClient().query('SELECT * FROM users WHERE 1 LIMIT 3');
        query.on('row', function(row) {
            n++;
            console.log(""+n+": %j", row);
        }).on('error', function(err) {
            console.log("dumpAllUsers: ERROR %j", err);
        }).on('end', function() {
            console.log("dumpAllUsers: END");
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
exports.testTheClient = theClient;