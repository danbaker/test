// packet.js
//  handle sending and receiving packets of data (strings) between sandbox and main app
//
//
// packet passed:
//  ## <number> !<string>
//  ## <number> {<json>
//
// when pull a packet out of a string, it returns the following:
//      {
//          packet: {                   // Note: if this attribute is missing, no packet was found
//              size:   <number>        // length of string in this packet
//              str:    <string>        // actual string
//              json:   { ... }         // actual json object
//          },
//          str:        <string>        // left-over string after removing the packet
//      }
var log = require('./log').log;


// send a string as a packet
var sendString = function(str, stream) {
    if (!stream) {
        log("PACKET: ERROR -- You forgot to pass the stream in!");
    }
    if (str && stream) {
        var n = str.length;
        log("PACKET: sending "+n+" bytes: "+str);
        stream.write("## "+n+" !"+str);
    }
};


// check a string received from other server/service if a complete packet is ready
// in:  str     = the string to check
// out: json    = json information:
//      {
//          packet: {                   // Note: if this attribute is missing, no packet was found
//              size:   <number>        // length of string in this packet
//              str:    <string>        // actual string
//          },
//          str:        <string>        // left-over string after removing the packet
//      }
//
var checkStringForCompletePacket = function(str) {
    log("PACKET: checking str: "+str);
    var json = { str: str };
    if (str) {
        str = str.replace(/^\s+/,"");               // trim whitespace from the beginning
        var idx = str.indexOf("## ");
        if (idx === 0) {
            str = str.substr(3).replace(/^\s+/,"");     // trim off the leading "##" + whitespace
            var len = parseInt(str, 10);                // get the length of the string in this packet
            idx = str.indexOf(" ");
            var type = str.charAt(idx+1);               // packet-type ("!"=string, "{"=json)
            str = str.substr(idx+2);                    // trim off the number (length of string)
            if (str.length >= len) {
                // NOTE: Have a packet !!
                var packetStr = str.substr(0,len);
                json.packet = {};
                json.packet.size = len;                 // length of packet-string
                switch (type) {
                    case "!":
                        json.packet.str = packetStr;
                        log("PACKET: FOUND PACKET: size="+len+" str="+packetStr);
                        break;
                    case "{":
                        try {
                            json.packet.json = JSON.parse(str);
                            log("PACKET: FOUND PACKET: size="+len+" object="+packetStr);
                        } catch (e) {
                            json.packet.json = {};
                            log("ERROR IN PACKET: size="+len+" BAD object="+packetStr);
                            log("ERROR IN PACKET: "+e);
                        }
                        break;
                    default:
                        log("ERROR IN PACKET: size="+len+" unknown type("+type+") str="+packetStr);
                        break;
                }
                json.str = str.substring(len);          // left over string
            }
        } else {
            // ERROR ... what do we do with a malformed string ??
            log("PACKET: ERROR! malformed string. stuck forever ??");
        }
    }
    return json;
};



// --- EXPORTS ---
exports.sendString = sendString;
exports.checkStringForCompletePacket = checkStringForCompletePacket;



// --- UNIT TESTS ---
exports.test = function() {
    var json;

    json = checkStringForCompletePacket("## 10 !abcdefghijLEFT OVER STRING");
    if (!json.packet) { console.log("ERROR: didn't find packet"); } else {
        if (json.packet.size !== 10) console.log("ERROR: string length wasn't 10");
        if (json.packet.str != 'abcdefghij') console.log("ERROR: packet string was wrong: "+json.packet.str);
        if (json.str !== 'LEFT OVER STRING') console.log("ERROR: didn't return correct left over: "+json.str);
    }
    json = checkStringForCompletePacket("## 10 !abcdefghij## 5 !12345## 1 !A");
    if (json.packet.size !== 10) console.log("ERROR: string length wasn't 10");
    json = checkStringForCompletePacket(json.str);
    if (json.packet.size !== 5) console.log("ERROR: string length wasn't 5");
    json = checkStringForCompletePacket(json.str);
    if (json.packet.size !== 1) console.log("ERROR: string length wasn't 1");
    json = checkStringForCompletePacket(json.str);
    if (json.packet) console.log("ERROR: got a packet, but shouldn't have");
};


