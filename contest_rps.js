// contest_rps.js
//  Contest:        Rock-Paper-Scissors
//
//  interface items MUST export:
//      exports.reset(sand1, sand2);            // resets all data for a new contest between two sandboxes (sand1, sand2)
//      exports.turn(sand, json, sandother);    // generic run-a-turn for "sand"
//      exports.turn1(json);                    // run-turn-player-1
//      exports.turn2(json);                    // run-turn-player-2
//      exports.isOver();                       // returns an object when contest is over:
//          {
//              message: "Player1 won 3 times.  Player2 won 2 times.  Player 1 wins."
//              winner: "P1"                    // "P1", "P2", "tie"
//              score: 1                        // some way to represent the score the winner gets
//          }
//
//
//
