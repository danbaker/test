// hexBoard.js
//  handle processing of a hex-board layout
//
//  "Point-Up Hex Layout"
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
//
//
//
//
//  "Point-Side Hex Layout"
//          0   1   2   3   4   5   6   7   8
//  0:      x       x       x       x       x
//              x       x       x       x
//  1:      x       x       x       x       x
//              x       x       x       x
//  2:      x       x       x       x       x
//              x       x       x       x
//  3:      x       x       x       x       x
//              x       x       x       x
//  4:      x       x       x       x       x
//              x       x       x       x
//
//              N
//         NW       NE (N + 1)
//              x
//         SW       SE (N + 2)
//              S (N + 3)
//

var showWarning = function(msg) {
    console.log("hexBoard.WARNING: "+msg);
};

// constructor to create a new hex-board
var HexBoard = function(width, height) {
    this.width = width;
    this.height = height;
    this.board = [];
    this.edgeCell = undefined;                  // the "cell" value returned for "off-board" cells
    this.setEdgesWrap(false);                   // default: no wrapping around at the edges
    this.setLayoutType(this.LAYOUT_POINT_UP);   // default: point-up (travel EAST/WEST easily)
};

HexBoard.prototype.setEdgesWrap = function(edgesWrap) {
    this.edgesWrap = !!edgesWrap;           // true means: move off left-edge wraps around to the right-edge
};

// see HexBoard.prototype.LAYOUT_POINT_UP or LAYOUT_POINT_SIDE
HexBoard.prototype.setLayoutType = function(layoutType) {
    this.layoutType = layoutType;
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

HexBoard.prototype.LAYOUT_POINT_UP = 1;         // can travel EAST/WEST easily
HexBoard.prototype.LAYOUT_POINT_SIDE = 2;       // can travel NORTH/SOUTH easily

HexBoard.prototype.DIR_WEST = 11;
//HexBoard.prototype.DIR_NORTHWEST = 12;
//HexBoard.prototype.DIR_NORTHEAST = 13;
HexBoard.prototype.DIR_EAST = 14;
//HexBoard.prototype.DIR_SOUTHEAST = 15;
//HexBoard.prototype.DIR_SOUTHWEST = 16;

HexBoard.prototype.DIR_NORTH = 1001;
//HexBoard.prototype.DIR_NORTHEAST = 1002;
//HexBoard.prototype.DIR_SOUTHEAST = 1003;
HexBoard.prototype.DIR_SOUTH = 1004;
//HexBoard.prototype.DIR_SOUTHWEST = 1005;
//HexBoard.prototype.DIR_NORTHWEST = 1006;

HexBoard.prototype.movePosInDir = function(pos, dir) {
    dir = this.normalizeDir(dir);
    if (this.layoutType === this.LAYOUT_POINT_UP) {
        var isOddRow = (pos.y & 1);
        switch(dir) {
            case this.DIR_WEST:
                pos.x--;
                break;
            case this.DIR_EAST:
                pos.x++;
                break;
            case this.DIR_WEST+1:               // DIR_NORTHWEST:
                pos.y--;
                if (!isOddRow) pos.x--;
                break;
            case this.DIR_WEST+2:               // DIR_NORTHEAST:
                pos.y--;
                if (isOddRow) pos.x++;
                break;
            case this.DIR_EAST+1:               // DIR_SOUTHEAST:
                pos.y++;
                if (isOddRow) pos.x++;
                break;
            case this.DIR_EAST+2:               // DIR_SOUTHWEST:
                pos.y++;
                if (!isOddRow) pos.x--;
                break;
            default:
                showWarning("direction("+dir+") unknown value");
                break;
        }
    } else {
        var isOddCol = (pos.x & 1);
        switch (dir) {
            case this.DIR_NORTH:
                pos.y--;
                break;
            case this.DIR_NORTH+1:              // DIR_NORTHEAST
                pos.x++;
                if (!isOddCol) pos.y--;
                break;
            case this.DIR_NORTH+2:              // DIR_SOUTHEAST
                pos.x++;
                if (isOddCol) pos.y++;
                break;
            case this.DIR_SOUTH:
                pos.y++;
                break;
            case this.DIR_SOUTH+1:              // DIR_SOUTHWEST
                pos.x--;
                if (isOddCol) pos.y++;
                break;
            case this.DIR_SOUTH+2:
                pos.x--;
                if (!isOddCol) pos.y--;
                break;
            default:
                showWarning("direction("+dir+") unknown value");
                break;
        }
    }
    this.normalizePos(pos);
    return this;
};

// make sure a direction is one of the known directions
HexBoard.prototype.normalizeDir = function(dir) {
    if (this.layoutType === this.LAYOUT_POINT_UP) {
        if (dir > 500) {
            showWarning("direction("+dir+" appears to be a LAYOUT_POINT_SIDE direction");
        }
        while (dir < this.DIR_WEST) dir += 6;
        while (dir > this.DIR_EAST+2) dir -= 6;
    } else {
        if (dir < 500) {
            showWarning("direction("+dir+" appears to be a LAYOUT_POINT_UP direction");
        }
        while (dir < this.DIR_NORTH) dir += 6;
        while (dir > this.DIR_SOUTH+2) dir -= 6;
    }
    return dir;
};

// make sure a position is on the screen (handle wrapping edges, iff needed)
HexBoard.prototype.normalizePos = function(pos) {
    if (!pos.x) pos.x = 0;
    if (!pos.y) pos.y = 0;
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

HexBoard.prototype.setCellAtPos = function(pos, value) {
    this.normalizePos(pos);
    if (pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y > this.height) {
        // can't set a cell off the board
    } else {
        this.board[pos.x][pos.y] = value;
    }
};


// public items
exports.HexBoard = HexBoard;


// UNIT TESTS
(function() {
    var assert = function(value, msg) {
        if (!value) console.log("hexBoard unit test failed: "+msg);
    };
    var assertCellAtPos = function(x,y,value) {
        var cell = brd.getCellAtPos({x:x,y:y});
        if (cell) {
            assert(value.x === cell.x && value.y === cell.y, "getCellAtPos("+x+","+y+")");
        } else {
            assert(cell === value, "undefined getCellAtPos("+x+","+y+")");
        }
    };
    var assertPosMoveTo = function(pos,dir,expected) {
        var tmp = {x:pos.x,y:pos.y};
        brd.movePosInDir(tmp, dir);
        assert(tmp.x === expected.x && tmp.y === expected.y, "movePosInDir("+pos.x+","+pos.y+",dir="+dir+") returned ("+tmp.x+","+tmp.y+") expected ("+expected.x+","+expected.y+")");
    };
    var brd = new HexBoard(5,4,false);
    brd.fillBoard(function(x,y) {
        return {x:x,y:y};
    });
    // non-wrapping
    assertCellAtPos(3,2, {x:3, y:2});
    assertCellAtPos(0,0, {x:0, y:0});
    assertCellAtPos(4,2, {x:4, y:2});
    assertCellAtPos(-1,0, undefined);
    assertCellAtPos(0,-1, undefined);
    assertCellAtPos(5,0, undefined);
    assertCellAtPos(0,4, undefined);
    brd.edgesWrap = true;
    // wrapping
    assertCellAtPos(-1,0, {x:4,y:0});
    assertCellAtPos(0,-1, {x:0,y:3});
    assertCellAtPos(5,0, {x:0,y:0});
    assertCellAtPos(0,4, {x:0,y:0});
    // wrapping AND point-up (east/west movement)
    brd.setLayoutType(brd.LAYOUT_POINT_UP);
    var pos;
    pos = {x:1,y:1};
    assertPosMoveTo(pos, brd.DIR_WEST, {x:0,y:1});
    assertPosMoveTo(pos, brd.DIR_WEST+1, {x:1,y:0});
    assertPosMoveTo(pos, brd.DIR_WEST+2, {x:2,y:0});
    assertPosMoveTo(pos, brd.DIR_EAST, {x:2,y:1});
    assertPosMoveTo(pos, brd.DIR_EAST+1, {x:2,y:2});
    assertPosMoveTo(pos, brd.DIR_EAST+2, {x:1,y:2});

    pos = {x:2,y:2};
    assertPosMoveTo(pos, brd.DIR_WEST, {x:1,y:2});
    assertPosMoveTo(pos, brd.DIR_WEST+1, {x:1,y:1});
    assertPosMoveTo(pos, brd.DIR_WEST+2, {x:2,y:1});
    assertPosMoveTo(pos, brd.DIR_EAST, {x:3,y:2});
    assertPosMoveTo(pos, brd.DIR_EAST+1, {x:2,y:3});
    assertPosMoveTo(pos, brd.DIR_EAST+2, {x:1,y:3});

    brd.setLayoutType(brd.LAYOUT_POINT_SIDE);
    pos = {x:1,y:1};
    assertPosMoveTo(pos, brd.DIR_NORTH, {x:1,y:0});
    assertPosMoveTo(pos, brd.DIR_NORTH+1, {x:2,y:1});
    assertPosMoveTo(pos, brd.DIR_NORTH+2, {x:2,y:2});
    assertPosMoveTo(pos, brd.DIR_SOUTH, {x:1,y:2});
    assertPosMoveTo(pos, brd.DIR_SOUTH+1, {x:0,y:2});
    assertPosMoveTo(pos, brd.DIR_SOUTH+2, {x:0,y:1});
    pos = {x:2,y:2};
    assertPosMoveTo(pos, brd.DIR_NORTH, {x:2,y:1});
    assertPosMoveTo(pos, brd.DIR_NORTH+1, {x:3,y:1});
    assertPosMoveTo(pos, brd.DIR_NORTH+2, {x:3,y:2});
    assertPosMoveTo(pos, brd.DIR_SOUTH, {x:2,y:3});
    assertPosMoveTo(pos, brd.DIR_SOUTH+1, {x:1,y:2});
    assertPosMoveTo(pos, brd.DIR_SOUTH+2, {x:1,y:1});
}());
