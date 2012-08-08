var express = require('express');
var pg = require('pg');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
    response.send('The UtahJS World is AMAZING -- Hello planet -- 2');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});




// DEBUG DATABASE
pg.connect(process.env.DATABASE_URL, function(err, client) {
//    var query = client.query('SELECT * FROM your_table');
//
//    query.on('row', function(row) {
//        console.log(JSON.stringify(row));
//    });


//    var query = client.query('CREATE TABLE users (id SERIAL PRIMARY KEY uname varchar(20) upw varchar(20))');
//    query.on('end', function() {
//        // table created OR failed
//    });
//
//    client.query('INSERT INTO users(uname,upw) VALUES($1,$2)', "danb", "secret");
});
