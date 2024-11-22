/**
 * File: tetris.js
 * Description: Tetris game
 * Author: ninjamar
 * Source: https://github.com/ninjamar/2tetris
 * Version: 1.0.0
 */
const SHAPES = [
    // Use null instead of 0 because we need to show that the shape only takes up the space it needs
    [
        [
            ["S", "S", "S", "S"] // Horizontal
        ],
        [
            ["S"],
            ["S"],
            ["S"],
            ["S"] // Vertical
        ]
    ],
    [
        [
            ["S", null, null],
            ["S", "S", "S"]
        ],
        [
            ["S", "S"],
            ["S", null],
            ["S", null]
        ],
        [
            ["S", "S", "S"],
            [null, null, "S"]
        ],
        [
            [null, "S"],
            [null, "S"],
            ["S", "S"]
        ]
    ],
    [
        [
            [null, null, "S"],
            ["S", "S", "S"]
        ],
        [
            ["S", null],
            ["S", null],
            ["S", "S"]
        ],
        [
            ["S", "S", "S"],
            ["S", null, null]
        ],
        [
            ["S", "S"],
            [null, "S"],
            [null, "S"]
        ]
    ],
    [
        [
            ["S", "S"],
            ["S", "S"]
        ]
    ],
    [
        [
            [null, "S", "S"],
            ["S", "S", null]
        ],
        [
            ["S", null],
            ["S", "S"],
            [null, "S"]
        ]
    ],
    [
        [
            ["S", "S", "S"],
            [null, "S", null]
        ],
        [
            [null, "S"],
            ["S", "S"],
            [null, "S"]
        ],
        [
            [null, "S", null],
            ["S", "S", "S"]
        ],
        [
            ["S", null],
            ["S", "S"],
            ["S", null]
        ]
    ],
    [
        [
            ["S", "S", null],
            [null, "S", "S"]
        ],
        [
            [null, "S"],
            ["S", "S"],
            ["S", null]
        ]
    ]
];
// TODO: Better colors
COLORS = [
    "aqua",
    // "black",
    "blue",
    "fuchsia",
    "gray",
    "green",
    "lime",
    "maroon",
    "navy",
    "olive",
    "purple",
    "red",
    "silver",
    "teal",
    "white"
];


function unbackloggedAdjustingInterval(callback, interval){
    // https://stackoverflow.com/a/29972322/
    let isBacklogged = false;

    let active = [];
    let expected = Date.now() + interval;
    setTimeout(step, interval)
    function step(){
        let drift = Date.now() - expected;
        if (drift > interval && active.length > 0){
            // When the tab isn't focused, the intervals will be backlogged
            // We don't want this to happen, so clear all the previous interval
            active.forEach(timeout => clearTimeout(timeout));
            active = [];
            isBacklogged = true;
        } else {
            isBacklogged = false;
        }
        if (!isBacklogged){
            callback();
        }
        expected += interval;
        let id = setTimeout(step, Math.max(0, interval - drift));
        active.push(id);
    }
}


/** 
 * Get a random color
 * @returns {String} *
 */
function getRandomColor(){
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}


/**
 * Represent a point on the board
 * @class Point
 * @typedef {Point}
 */
class Point {
    // TODO: Probably use a dict for this
    constructor(value, color = "black"){
        this.value = value;
        this.color = color;
    }
}


/**
 * Class representing a shape
 * @class Shape
 * @typedef {Shape}
 */
class Shape {
    /**
     * Creates an instance of Shape.
     *
     * @constructor
     */
    constructor() {
        this.color = getRandomColor();
        this.template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        this.template = this.template.map(pattern => pattern.map(row => row.map(point => new Point(point, this.color))));

        this.dir = 0; // pattern[dir]
        this.topLeft = null;
    }
    /**
     * Get the image for the shape
     * @readonly
     * @type {*}
     */
    get image() {
        return this.template[this.dir]; // rotate = (dir + 1) % 4
    }
}


/**
 * The Tetris game manager
 * @class Tetris
 * @typedef {Tetris}
 */
class Tetris {
    /**
     * Creates an instance of Tetris.
     *
     * @constructor
     * @param {HTMLElement} - Canvas of game display
     * @param {Function} gameOverFN - Calls this function when the game is over - Make sure to set this.isGameOver to false
     * @param {Function} incrementScoreFN - Called when score is incremented
     */
    constructor($elem, gameOverFN, incrementScoreFN) {
        this.ctx = $elem.getContext("2d");
        
        this.gameOver = gameOverFN.bind(this);
        this.incrementScore = incrementScoreFN.bind(this);

        this.cols = 10;
        this.rows = 20;

        this.cellSize = 20;
        this.ctx.scale(this.cellSize, this.cellSize);

        this.init();
    }
    /**  
     * Start/Restart the game
    */
    init(){
        this.isGameRunning = true;
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(new Point(0)));
        this.spawnShape();
    }
    /**  
     * Draw the game to the canvas
    */
    draw() {    
        // Remember that ctx is scaled to this.cellSize
        this.ctx.clearRect(0, 0, this.cols, this.rows);
        for (let y = 0; y < this.board.length; y++) {
            for (let x = 0; x < this.board[y].length; x++) {
                this.drawCell(x, y, this.board[y][x].color);
            }
        }
    }
    
    /**
     * Draw a cell on the board
     * @param {Number} x - X coordinate
     * @param {Number} y - Y coordinate
     * @param {String} color - Color
     */
    drawCell(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, 1, 1);
    }
    
    /**  
     * Spawn a new shape
    */
    spawnShape() {
        this.shape = new Shape();
        this.shape.topLeft = [];
        if (!this.projectShapeByXY(Math.floor(this.cols / 2) - 1, 0)) {
            this.gameOver();
        }
    }
    
    /**  
     * Lock the current shape, then spawn a new shape
    */
    lockThenSpawnShape() {
        // Make the shape stuck on the board
        // this.board = this.board.map(y => y.map(x => x == "S" ? 1 : x));
        // this.board = this.board.map(y => y.map(x => x.value = x.value == "S" ? 1 : x.value));
        // Don't change color because when going from shape to lock, color stays the same
        this.board.forEach(y => y.forEach(x => x.value = x.value == "S" ? 1 : x.value));
        this.spawnShape();
    }
    
    /** 
     * Remove the current shape if at the last row
     * @returns {boolean} True if the shape is at the last row, False if not
     * */
    isAtLastRowCleanup() {
        // Remove shape if at the bottom row
        if (this.shape.topLeft[1] + this.shape.image.length >= this.rows) {
            this.lockThenSpawnShape();
            return true;
        }
        return false;
    }
    
    /** 
     * Check if the shape cant move down
     * @returns {boolean} True if the shape is stuck, False if not 
     * */
    isStuckCleanup() {
        // Collision by columns
        // Check if we can move down. If we can't, then lockThenSpawnShape()
        for (let y = 0; y < this.shape.image.length; y++) {
            for (let x = 0; x < this.shape.image[y].length; x++) {
                let tile = this.shape.image[y][x];
                let boardX = this.shape.topLeft[0] + x;
                let boardY = this.shape.topLeft[1] + y;
                if (this.board[boardY + 1][boardX].value == 1 && tile.value == "S") {
                    this.lockThenSpawnShape();
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Check if there is a collision from the current board to the new board
     * @param {Array} newBoard - The board to compare, same as this.board
     * @returns {boolean} - True if collision, False if not
     */
    collisionFromOldToNew(newBoard) {
        for (let y = 0; y < this.shape.image.length; y++) {
            for (let x = 0; x < this.shape.image[y].length; x++) {
                // let tile = this.shape.image[y][x];
                let boardX = this.shape.topLeft[0] + x;
                let boardY = this.shape.topLeft[1] + y;
                if (this.board[boardY][boardX].value == 1 && newBoard[boardY][boardX].value == "S") {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Apply the current shape to some board
     * @param {Array} target - The board
     * @returns {Array} The target
     */
    applyShapeToTarget(target) {
        for (let y = 0; y < this.shape.image.length; y++) {
            for (let x = 0; x < this.shape.image[y].length; x++) {
                let tile = this.shape.image[y][x];
                let boardX = this.shape.topLeft[0] + x;
                let boardY = this.shape.topLeft[1] + y;
                if (tile.value == "S") {
                    target[boardY][boardX].value = tile.value;
                    target[boardY][boardX].color = tile.color;
                }
            }
        }
        return target;
    }
    
    /** 
     * Create a copy of the current board
     * @returns {Array} The copy of the current board 
     * */
    copyBoard(){
        let res = [];
        for (let y = 0; y < this.board.length; y++){
            let row = []
            for (let x = 0; x < this.board[y].length; x++){
                let tile = this.board[y][x];
                row.push(new Point(tile.value, tile.color));
            }
            res.push(row);
        }
        return res;
    }
    
    /**
     * Rotate a shape
     * @param {Number} newDir - Direction to set shape rotation to
     * @returns {boolean} True if successful, False if not
     */
    projectShapeByRotation(newDir) {
        let oldBoard = this.copyBoard();
        this.board.forEach(y => y.forEach(x => {
            if (x.value == "S"){
                x.value = 0;
                x.color = "black";
            }
        }));
        let newBoard = this.copyBoard();

        let oldDir = this.shape.dir;
        this.shape.dir = newDir;

        if (this.shape.topLeft[0] < 0 || this.shape.topLeft[0] + this.shape.image[0].length > this.cols || this.shape.topLeft[1] < 0 || this.shape.topLeft[1] + this.shape.image.length > this.rows) {
            this.board = oldBoard;
            // If the shape can't be rotated, try rotating the shape one more time
            this.projectShapeByRotation((newDir + 1) % this.shape.template.length);
            return false;
        }

        newBoard = this.applyShapeToTarget(newBoard);

        if (this.collisionFromOldToNew()) {
            this.shape.dir = oldDir;
            this.board = oldBoard;
            return false;
        }
        this.board = newBoard;
        // Remove shape if at the bottom row
        if (this.isAtLastRowCleanup() || this.isStuckCleanup()) {
            this.clearRows();
            return false;
        }
        return true;

    }
    
    /**
     * Move a shape around
     * @param {Number} newTopLeftX - New X coordinate
     * @param {Number} newTopLeftY - New Y coordinate
     * @returns {boolean} True if successful, False if not
     */
    projectShapeByXY(newTopLeftX, newTopLeftY) {
        if (newTopLeftX < 0 || newTopLeftX + this.shape.image[0].length > this.cols || newTopLeftY < 0 || newTopLeftY + this.shape.image.length > this.rows) {
            return false;
        }
        let oldBoard = this.copyBoard();

        this.board.forEach(y => y.forEach(x => {
            if (x.value == "S"){
                x.value = 0;
                x.color = "black";
            }
        }));
        let newBoard = this.copyBoard();

        // Only update the one we need
        let oldTopLeft = [...this.shape.topLeft];
        this.shape.topLeft = [newTopLeftX, newTopLeftY];

        newBoard = this.applyShapeToTarget(newBoard);

        if (this.collisionFromOldToNew(newBoard)) {
            this.shape.topLeft = oldTopLeft;
            this.board = oldBoard;
            return false;
        }
        this.board = newBoard;

        if (this.isAtLastRowCleanup() || this.isStuckCleanup()) {
            // Clear the rows and update the score
            this.clearRows();
            return false;
        }
        return true;
    }
    
    /**  
     * Clear the rows on the board, and increment score
    */
    clearRows() {
        let newBoard = [];
        let rowsCleared = 0;
        for (let y = this.board.length - 1; y >= 0; y--) {
            if (this.board[y].every(x => x.value == 1)) {
                rowsCleared++;
            } else {
                newBoard.unshift(this.board[y])
            }
        }
        while (newBoard.length < this.board.length) {
            // Make sure that that each row gets it own Point, not a reference
            newBoard.unshift(Array.from({length: this.cols}, () => new Point(0)));
        }
        this.board = newBoard;
        // todo fix
        if (rowsCleared > 0) {
            this.incrementScore(Math.round(100 * (Math.log(rowsCleared) / Math.log(10)) + 10));
        }
    }
    
    /** 
     * Interface of which controls are translated to function calls
     * @param {String} event - The current command
     * */
    receiveEvent(event) {
        if (!this.isGameRunning) {
            return;
        }
        switch (event) {
            case "left":
                this.projectShapeByXY(this.shape.topLeft[0] - 1, this.shape.topLeft[1]);
                this.draw();
                break;
            case "right":
                this.projectShapeByXY(this.shape.topLeft[0] + 1, this.shape.topLeft[1]);
                this.draw();
                break;
            case "rotate":
                this.projectShapeByRotation((this.shape.dir + 1) % this.shape.template.length);
                this.draw();
                break;
            case "softDrop":
                this.projectShapeByXY(this.shape.topLeft[0], this.shape.topLeft[1] + 1);
                this.draw();
                break;
            case "hardDrop":
                let res;
                do {
                    res = this.projectShapeByXY(this.shape.topLeft[0], this.shape.topLeft[1] + 1);
                } while (res);
                this.draw();
                break;
        }
    }
}

/** 
 * A controller for Tetris
 * Adds handlers for keybinds
 * @param {Function} signal - Registers event listeners to call game.recieveEvent. Game is passed as an argument
 * @param {...{}} args - Args to passthrough to Tetris
 * */
function TetrisGameHandler(signal, ...args){
    let game = new Tetris(...args);
    signal(game); // Register handlers
    game.draw();
    unbackloggedAdjustingInterval(() => {
        game.receiveEvent("softDrop");
        // window.requestAnimationFrame(game.draw);
    }, 1000);
    return game;
}
// TODO: Add description + audio