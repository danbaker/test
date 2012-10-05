// hexBoard.js
//  handle processing of a hex-board layout
//
//
//         0    1    2    3    4
//  0:    x    x    x    x    x
//
//  1:      x    x    x    x    x
//
//  2:    x    x    x    x    x
//
//  3:      x    x    x    x    x
//
//  4:    x    x    x    x    x
//
//  5:      x    x    x    x    x
//
//
//          NW   NE
//
//      WEST   x    EAST
//
//          SW  SE

// constructor to create a new hex-board
var HexBoard = function(width, height, edgesWrap) {
    this.width = width;
    this.height = height;
    this.edgesWrap = !!edgesWrap;           // true means: move off left-edge wraps around to the right-edge
    this.board = [];
    this.edgeCell = undefined;              // the "cell" value returned for "off-board" cells
};

HexBoard.prototype.fillBoard = function(fncMakeOneCell) {
    var x,y;
    this.board = [];
    for(x=0; x<this.width; x++) {
        this.board[x] = [];
        for(y=0; y<this.height; y++) {
            this.board[x][y] = fncMakeOneCell(x,y);
        }
    }
};

HexBoard.prototype.DIR_WEST = 0;
HexBoard.prototype.DIR_NORTHWEST = 1;
HexBoard.prototype.DIR_NORTHEAST = 2;
HexBoard.prototype.DIR_EAST = 3;
HexBoard.prototype.DIR_SOUTHEAST = 4;
HexBoard.prototype.DIR_SOUTHWEST = 5;

HexBoard.prototype.movePosInDir = function(pos, dir) {
    var isOddRow = (pos.y & 1);
    dir = this.normalizeDirection(dir);
    switch(dir) {
        case this.DIR_WEST:
            pos.x--;
            break;
        case this.DIR_EAST:
            pos.x++;
            break;
        case this.DIR_NORTHWEST:
            pos.y--;
            if (!isOddRow) pos.x--;
            break;
        case this.DIR_NORTHEAST:
            pos.y--;
            if (isOddRow) pos.x++;
            break;
        case this.DIR_SOUTHEAST:
            pos.y++;
            if (!isOddRow) pos.x--;
            break;
        case this.DIR_SOUTHWEST:
            pos.y++;
            if (isOddRow) pos.x++;
            break;
    }
    this.normalizePos(pos);
    return this;
};

// make sure a direction is one of the known directions
HexBoard.prototype.normalizeDir = function(dir) {
    while (dir < 0) dir += 6;
    while (dir > 5) dir -= 6;
    return dir;
};

// make sure a position is on the screen (handle wrapping edges, iff needed)
HexBoard.prototype.normalizePos = function(pos) {
    if (this.edgesWrap) {
        while (pos.x < 0) pos.x += this.width;
        while (pos.x >= this.width) pos.x -= this.width;
        while (pos.y < 0) pos.y += this.height;
        while (pos.y >= this.height) pos.y -= this.height;
    }
};

// return the board-value at a given position
HexBoard.prototype.getCellAtPos = function(pos) {
    this.normalizePos(pos);
    if (pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y > this.height) {
        return this.edgeCell;
    }
    return this.board[pos.x][pos.y];
};


// public items
exports.HexBoard = HexBoard;


// UNIT TESTS
(function() {
    var assert = function(value, msg) {
        if (!value) console.log("hexBoard unit test failed: "+msg);
    };
    var brd = new HexBoard(5,3,false);
    brd.fillBoard(function(x,y) {
        return {x:x,y:y};
    });
    assert(brd.getCellAtPos({x:3,y:2}) == {x:3, y:2}, "getCellAtPos");

}());
