let createPlayer = (symbol) => {
    let marker = symbol;
    
    let getMarker = () => {
        return marker;
    };

    return {
        getMarker
    };
};

const board = (function() {
    let board = [['', '', ''], ['', '', ''], ['', '', '']];

    let getBoard = () => {
        return board;
    };

    let updateBoard = (x, y, symbol) => {
        board[x][y] = symbol;
    }

    let clearBoard = () => {
        board = [['', '', ''], ['', '', ''], ['', '', '']];
    };

    return {
        getBoard,
        updateBoard,
        clearBoard
    }

})();

const displayController = (function() {

    let grid = document.querySelector(".gameboard");

    let renderBoardDisplay = () => {

        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                let cell = document.createElement("button");

                cell.classList.add("cell");
                cell.id = `cell-${i}-${j}`;

                const writeMove = () => gameController.writeMoveToBoard(i, j);
                cell.addEventListener("click", writeMove);
                grid.appendChild(cell);
            }
        }
    };

    let updateBoardDisplay = (x, y) => {
        let boardData = board.getBoard();
        let cell = document.querySelector(`#cell-${x}-${y}`);

        if(boardData[x][y] != '') {
            cell.textContent = boardData[x][y];
            cell.disabled = true;
        }
    }

    let resetBoardDisplay = () => {
        for (cell of grid.children) {
            cell.textContent = "";
            cell.disabled = false;
        }
    };

    let initResultsModal = () => {
        const resultsModal = document.querySelector("#results-modal");
        const closeResultsModal = () => closeModal(resultsModal);
        resultsModal.addEventListener("click", closeResultsModal);

        const restartBtn = document.querySelector("#modal-restart-btn");
        restartBtn.addEventListener("click", () => {
            gameController.resetGame();
            closeModal(resultsModal);
        });
    };

    let closeModal = (modal) => {
        modal.style.display = "none";
    }

    let displayResults = (state) => {
        const resultsModal = document.querySelector("#results-modal");
        const resultsHeader = document.querySelector("#results-text");
        let resultsText = "";

        switch(state) {
            case -1:
                resultsText = "It's a tie!";
            break;
            case 1:
                resultsText = "P1 wins!";
            break;
            case 2:
                resultsText = "P2 wins!";
            break;
            default:
                throw Error("Unreachable game state");
        }
        
        resultsHeader.textContent = resultsText;
        resultsModal.style.display = "block";
    };

    return {
        initResultsModal,
        renderBoardDisplay,
        updateBoardDisplay,
        resetBoardDisplay,
        displayResults
    };

})();

const gameController = (function() {
    let state = 0;   // 0 = undetermined, 1 = p1 win, 2 = p2 win, -1 = tie
    let numMoves = 0;
    let p1 = createPlayer("X");
    let p2 = createPlayer("O");
    let activePlayer = p1;

    let getState = () => state;

    let setNextPlayer = () => {
        activePlayer = activePlayer == p1 ? p2 : p1;
        return activePlayer;
    };

    let writeMoveToBoard = (x, y) => {
        if(state == 0) {
            numMoves++;
            board.updateBoard(x, y, activePlayer.getMarker());
            displayController.updateBoardDisplay(x, y);
            evaluateState();
            if(state == 0) {
                setNextPlayer();
            } else {
                loadGameResults();
            }
        }
    };

    let evaluateState = () => {
        const n = 3; // Board length/width

        // Win impossible before 2n-1 moves
        if(numMoves < (2*n)-1) { 
            return state;
        }
        // No moves left after 2^n moves
        if(numMoves > n*n) {
            state = -1;
            return state;
        }

        boardState = board.getBoard();
        symbol1 = p1.getMarker();
        symbol2 = p2.getMarker();

        const center = Math.floor(n/2);
        const centerSymbol = boardState[center][center];
        if(centerSymbol != '') {
            let match = [true, true, true, true]; // Horizontal, Vertical, L to R diagonal, R to L diagonal
            for(let i = 1; i < center+1; i++) {
                if(match[0] && (boardState[center][center-i] != centerSymbol || boardState[center][center+i] != centerSymbol))
                    match[0] = false;
                if(match[1] && (boardState[center-i][center] != centerSymbol || boardState[center+i][center] != centerSymbol))
                    match[1] = false;
                if(match[2] && (boardState[center-i][center-i] != centerSymbol || boardState[center+i][center+i] != centerSymbol))
                    match[2] = false;
                if(match[3] && (boardState[center-i][center+i] != centerSymbol || boardState[center+i][center-i] != centerSymbol))
                    match[3] = false;
            }

            // One of the above cases is a win
            if(match.includes(true)) {
                state = symbol1 == centerSymbol ? 1 : 2;
                return state;
            }
        }

        let focus = 1;
        while(focus < center+1) {
            // The midpoints of the row/col that is offset
            // from the center
            const foci = [
                boardState[center-focus][center],
                boardState[center][center+focus],
                boardState[center+focus][center],
                boardState[center][center-focus]
            ]
            let match = [true, true, true, true]; // Top horizontal, right vertical, bottom horizontal, left vertical
            for(let i = 1; i < center+1; i++) {
                if(foci[0] == '' || match[0] && (boardState[center-focus][center-i] != foci[0] || boardState[center-focus][center+i] != foci[0]))
                    match[0] = false;
                if(foci[1] == '' || match[1] && (boardState[center-i][center+focus] != foci[1] || boardState[center+i][center+focus] != foci[1]))
                    match[1] = false;
                if(foci[2] == '' || match[2] && (boardState[center+focus][center-i] != foci[2] || boardState[center+focus][center+i] != foci[2]))
                    match[2] = false;
                if(foci[3] == '' || match[3] && (boardState[center-i][center-focus] != foci[3] || boardState[center+i][center-focus] != foci[3]))
                    match[3] = false;
            }

            // One of the above cases is a win
            if(match.includes(true)) {
                for(let i = 0; i < match.length; i++) {
                    if(match[i]) {
                        state = symbol1 == foci[i] ? 1 : 2;
                        return state;
                    }
                }
            }

            focus++;
        }

        // Board filled but no wins detected
        if(numMoves == n*n) {
            state = -1;
        }

        return state;
    };

    let loadGameResults = () => {
        displayController.displayResults(state);
    };

    let resetGame = () => {
        state = 0;
        numMoves = 0;
        activePlayer = p1;
        board.clearBoard();
        displayController.resetBoardDisplay();
    };

    return {
        getState,
        writeMoveToBoard,
        resetGame
    };

})();

displayController.renderBoardDisplay();
displayController.initResultsModal();

const resetBtn = document.querySelector("#home-restart-btn");
resetBtn.addEventListener("click", gameController.resetGame);