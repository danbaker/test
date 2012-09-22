// routesHelper
//  some helper functions for all routes
var utdb = require('./utdb');

exports.getParam = function(req,name) {
    if (req.params && req.params[name] !== undefined) return req.params[name];
    if (req.query && req.query[name] !== undefined) return req.query[name];
    if (req.body && req.body[name] !== undefined) return req.body[name];
    return undefined;
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

// check if user requested docs -- return docs (and return "true")
exports.showDocs = function(req,res,docs) {
    if (utdb.isLocal()) {
        var uobj = {};
        uobj.name = "LocalDANB";
        uobj.id = 12345;
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
    var x = exports.getParam(req, "fields");         // "id,name"
    if (x) options.fields = x;
    x = exports.getParam(req, "limit");              // 10
    console.log("limit read as: "+x);
    if (!x) x = 0;
    console.log("... x = "+x);
    if (x) x = parseInt(x);
    console.log("... x = "+x);
    if (x<1 || x>500) x = 500;                  // absolute maximum rows can return in 1 query
    console.log("... x = "+x);
    options.limit = x;
    x = exports.getParam(req, "offset");             // 100
    if (x) options.offset = x;
    return options;
};
