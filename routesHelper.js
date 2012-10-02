// routesHelper
//  some helper functions for all routes
var utdb = require('./utdb');

exports.getParam = function(req,name) {
    if (!name) {
        console.log("ERROR: Did you forget to pass in the req object to getParam");
    }
    if (req.params && typeof req.params[name] == "string") return req.params[name];
    if (req.query && typeof req.query[name] == "string") return req.query[name];
    if (req.body && typeof req.body[name] == "string") return req.body[name];
    return undefined;
};

exports.setParam = function(req, name, value) {
    req.params[name] = value;
};

// parse a string into a JSON object
exports.parseToObject = function(str) {
    var obj;
    try {
        obj = JSON.parse(str);
    } catch (e) {
        console.log("parseToObject("+str+") ERROR: %j", e);
        return undefined;
    }
    return obj;
};

exports.sendJson = function(res, json) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(json));
};

// check if the user is logged in for a given request
exports.isLoggedIn = function(req) {
    if (req && req.session && req.session.user && req.session.user.auth) {
        return true;
    }
};
// check if the user is authorized for a given action ("n" is a bit -- see utdb.js)
exports.isAuth = function(req, n) {
    if (req && req.session && req.session.user)
        return req.session.user.auth & n;               // 1, 2, 4, 8 ...  (see utdb.js)
    return false;
};

exports.getUserId = function(req) {
    if (!req) console.log("ERROR: Did you forget to pass in req object to getUserId?");
    if (req && req.session && req.session.user)
        return req.session.user._id;
    return undefined;
};


// check if user requested docs -- return docs (and return "true")
exports.showDocs = function(req,res,docs) {
    if (utdb.isLocal()) {
        var uobj = {};
        uobj.name = "LocalDANB";
        uobj.id = 12345;
        uobj._id = "123abc";
        uobj.auth = 255;
        req.session.user = uobj;
    }
    if (req && req.query && (req.query["docs"] || req.query["doc"])) {
        var i;
        var msg = "";
        var method = docs.method || "GET";
        msg += "Documentation for request: "+req.url+"<br>";
        msg += ".. usage: "+method+" /apis/"+docs.version+"/"+docs.api;
        if (docs.params) {
            for(i=0; i<docs.params.length; i++) {
                msg += "/"+docs.params[i].substr(0,docs.params[i].indexOf(" "));
            }
        }
        msg += "<br>";
        msg += ".. api: "+docs.api+"<br>";
        msg += ".. version: "+docs.version+"<br>";
        msg += ""+docs.description+"<br>";
        if (docs.urlparams && docs.urlparams.length) {
            msg += ".. URL parameters:<br>";
            for(i=0; i<docs.urlparams.length; i++) {
                msg += ".. .. "+i+": "+docs.urlparams[i]+"<br>";
            }
            msg += "<br>";
        }
        if (docs.params && docs.params.length) {
            msg += ".. parameters (passed as ? arguments or POST in body:<br>";
            for(i=0; i<docs.params.length; i++) {
                msg += ".. .. : "+docs.params[i]+"<br>";
            }
        }
        msg += "<br><br>" + docs.longDesc;
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(msg);
        return true;
    }
    return false;
};

// get an array of field-names from the request "?fields=id,name"
exports.getFields = function(req) {
    var fields = exports.getParam(req, "fields");
    if (fields) {
        fields = fields.split(",");
        if (fields.length) {
            return fields;
        }
    }
    return undefined;
};

// clean(shrink) a collection based on ?field=
exports.cleanCollection = function(req, coll) {
    var fields = exports.getFields(req);
    if (fields) {
        for(var i=0; i<coll.length; i++) {
            coll[i] = cleanItem(fields, coll[i]);
        }
    }
    return coll;
};

// clean a single item(object), based on a list of wanted field-names
var cleanItem = function(fields, item) {
    if (fields) {
        var r = {};
        for(var i=0; i<fields.length; i++) {
            r[fields[i]] = item[fields[i]];
        }
        return r;
    }
    return item;
};

// clean(shrink) a single item based on ?field=
exports.cleanItem = function(req, item) {
    var fields = exports.getFields(req);
    return cleanItem(fields, item);
};

// generate an "options" object that can be sent to the database object when querying a collection
exports.makeOptions = function(req) {
    var options = {};
    var i, x;
    // FIELDS -- specific fields to return
    x = exports.getParam(req, "fields");         // "id,name"
    if (x) {
        x = x.split(",");                           // ["id", "name"]
        options.fields = {};
        for(i=0; i<x.length; i++) {
            options.fields[x[i]] = true;            // {id:true, nane:true}
        }
    }
    // LIMIT -- the maximum # of items to return
    x = exports.getParam(req, "limit");              // 10
    if (!x) x = 0;
    if (x) x = parseInt(x);
    if (x<1 || x>500) x = 500;                  // absolute maximum rows can return in 1 query
    options.limit = x;
    // OFFSET -- the number of items to skip (or start)
    x = exports.getParam(req, "offset");             // 100
    if (x) x = parseInt(x);
    if (x > 0) options.offset = x;
    // QUERY -- a way to narrow which items are selected
    x = exports.getParam(req, "query");                     // query=first_name:Dan,last_name:Baker
    var contest_id = exports.getParam(req, "contest_id");   // specified contest ("100ae45f")
    if (x || contest_id) {
        options.query = {};
        if (x) {
            x = x.split(",");                               // ["first_name:Dan", "last_name:Baker"]
            for(i=0; i<x.length; i++) {
                var parts = x[i].split(":");                // parts[0] = "first_name", parts[1] = "Dan"
                if (parts.length === 2) {
                    options.query[parts[0]] = parts[1];     // { first_name:"Dan", last_name:"Baker" }
                }
            }
        }
        if (contest_id) {
            options.query.contest_id = contest_id;              // limit search to specified contest (from url)
        }
    }
    // SORT -- specify sorting:  sort=lastName:1,firstName:-1       sort=lastName,firstName
    x = exports.getParam(req, "sort");
    if (x && x.split) {
        x = x.split(",");                               // ["first_name:1", "last_name:-1"]
        for(i=0; i<x.length; i++) {
            var parts = x[i].split(":");                // parts[0] = "first_name", parts[1] = "1" or "asc"  or "-1" or "desc"
            var oneSort = [];
            oneSort.push(parts[0]);                     // [ "first_name" ]
            if (parts.length === 2) {
                oneSort.push(parts[1]);                 // [ "first_name" , "1" ]
            } else if (parts.length === 1) {
                oneSort.push("1");
            }
            if (!options.sort) options.sort = [];
            options.sort.push(oneSort);
        }
    }
    return options;
};
