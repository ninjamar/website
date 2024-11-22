function loadGame() {
    let $games = document.querySelectorAll(".game");
    let $score = document.querySelector(".game-message > span.score > span");
    let $highscore = document.querySelector(".game-message > span.highscore > span");
    let $gameOver = document.querySelector(".game-message > div");

    let highscore;
    if (!localStorage.getItem("2tetris.highscore")){
        localStorage.setItem("2tetris.highscore", (0).toString());
        highscore = 0;
    } else {
        highscore = parseInt(localStorage.getItem("2tetris.highscore"), 10);
        $highscore.textContent = highscore;
    }

    
    let score = 0;
    function gameOverFN() {
        this.isGameRunning = false;
        $gameOver.style.visibility = "visible";
    };
    
    function incrementScore(x) {
        score +=x;
        $score.textContent = score;
        if (score > highscore){
            highscore = score;
            localStorage.setItem("2tetris.highscore", score.toString());
            $highscore.textContent = score;
        }
    };

    function loadKeyHandlers(game){
        const isOnMobile = window.matchMedia("(max-width: 730px)").matches;
        if (isOnMobile){
            let names = ["left", "right", "rotate", "soft", "hard"];
            let events = ["left", "right", "rotate", "softDrop", "hardDrop"];
            names.forEach((n, i) => {
                document.querySelector(`.mobile-controls .${n}`).addEventListener("click", () => {
                    game.receiveEvent(events[i]);
                });
            });
        } else {
            document.addEventListener("keydown", (event) => {
                switch (event.key) {
                    case "ArrowLeft":
                        game.receiveEvent("left");
                        break;
                    case "ArrowRight":
                        game.receiveEvent("right");
                        break;
                    case "ArrowUp":
                        game.receiveEvent("rotate");
                        break;
                    case "ArrowDown":
                        game.receiveEvent("softDrop");
                        break;
                    case " ": // Space
                        game.receiveEvent("hardDrop");
                        break;
                }
            });
        }
    }

    let left = TetrisGameHandler(loadKeyHandlers, $games[0], gameOverFN, incrementScore);
    let right = TetrisGameHandler(loadKeyHandlers, $games[1], gameOverFN, incrementScore);
    function restart(){
        incrementScore(-score);
        left.init();
        right.init();
    }
    return {restart: restart, left: left, right: right};
}

document.addEventListener("DOMContentLoaded", () => {
    let manager = loadGame();
    document.querySelector(".restart").addEventListener("click", (e) => {
        manager.restart();
        e.currentTarget.blur();
    });
});