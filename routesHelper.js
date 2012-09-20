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
