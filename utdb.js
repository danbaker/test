
var pg = require('pg');
var nhash = require('node_hash');

var theClient = undefined;              // the database-client-connection object
var onReadyFncs = [];


// establish THE connection to THE database
pg.connect(process.env.DATABASE_URL, function(err, client) {
    if (err) {
        console.log("database connection error: "+err);
    } else {
        var query;
        //    var query = client.query('SELECT * FROM your_table');
        //
        //    query.on('row', function(row) {
        //        console.log(JSON.stringify(row));
        //    });


//        var query = client.query('CREATE TABLE users (id SERIAL PRIMARY KEY, uname varchar(20), upw varchar(20))');
//        query.on('end', function() {
//            // table created OR failed
//            console.log("2");
//        });
//        console.log("3");
//        query = client.query('INSERT INTO users(uname,upw) VALUES($1,$2)', ["danb", "secret"]);
//        query.on('end', function() {
//            // table created OR failed
//            console.log("2");
//        });
//        console.log("4");
//        query = client.query('SELECT * FROM users');
//        query.on('row', function(result) {
//            if (!result) {
//                console.log("nothing selected.  boo hoo");
//            } else {
////                debug_text += "id:"+result.id+" uname:"+result.uname+" upw:"+result.upw+"<br>";
//                console.log("%j", result);
//            }
//        });

        // save the client-connection-object (allowing others to operate on the database)
        theClient = client;

        // call all "onReady" functions
        for(var i=0; i<onReadyFncs.length; i++) {
            onReadyFncs[i]();
        }
        onReadyFncs = [];
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
    console.log("findUser u="+name+" pw="+pw);
    if (theClient) {
        pw = encryptPW(pw, name);
        var query = theClient.query("SELECT id FROM users WHERE uname='$1' AND upw='$2')", [name,pw]);
        query.on('row', function(result) {
            console.log("got a row");
            console.log(result);
            if (result) {
                fnc(result);
            }
        });
    } else {
        fnc(undefined);
    }
};

// add a new user to the system
exports.addUser = function(name, pw) {
    if (theClient) {
        pw = encryptPW(pw, name);
        var query = theClient.query('INSERT INTO users(uname,upw) VALUES($1,$2)', [name,pw]);
        query.on('end', function() {
            // user inserted OR failed
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

exports.testencryptPW = encryptPW;