// sandbox.js - Rudimentary JS sandbox
// Gianni Chiappetta - gf3.ca - 2010

/*------------------------- INIT -------------------------*/
var fs = require( 'fs' )
  , path = require( 'path' )
  , spawn = require( 'child_process' ).spawn;

/*------------------------- Sandbox -------------------------*/
function Sandbox( options ) {
  ( this.options = options || {} ).__proto__ = Sandbox.options;

    var pn = this.options.pn;

    this.run = function( code, hollaback ) {
        // Any vars in da house?
        var timer,
            stdout = '',
            child = spawn( this.options.node, [this.options.shovel] ),
            fnOutput = function( data ) {
                if ( !!data )
                    stdout += data
            };

        // Listen
        child.stdout.on( 'data', fnOutput );
        child.on( 'exit', function( code ) {
            clearTimeout( timer );
            // write data to external file (for debugging) -- eventually, allow real end-user access to it
            if (pn) {
                var thefile = path.join(__dirname, "log_"+pn+".txt");
                fs.writeFile(thefile, stdout, function(err) {});
            }
            hollaback.call( this, JSON.parse( stdout ) );
        });

        // Go
        child.stdin.write( code );
        child.stdin.end();
        timer = setTimeout( function() {
                child.stdout.removeListener( 'output', fnOutput );
                stdout = JSON.stringify( { result: 'TimeoutError', console: [] } );
                child.kill( 'SIGKILL' );
            }, this.options.timeout );

        // @TODO: WHEN we get a signal to run this player code again -- reset the timer again (another N seconds)
    }
}

// Options
Sandbox.options =
{
    timeout: 5000,           // allow player code to run N seconds
    node: 'node',
    shovel: path.join( __dirname, 'shovel.js' )
};

// Info
//fs.readFile( path.join( __dirname, '..', 'package.json' ), function( err, data ) {
//  if ( err )
//    throw err
//  else
//    Sandbox.info = JSON.parse( data )
//})

/*------------------------- Export -------------------------*/
module.exports = Sandbox;

