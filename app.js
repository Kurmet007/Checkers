const size = 8;
let board = [];
let currentPlayer = "red";
let selected = null;
let highlightedCells = [];

function initBoard() {
  board = Array(size).fill(null).map(() => Array(size).fill("."));

  // red pieces
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < size; col++) {
      if ((row + col) % 2 === 1) board[row][col] = "r";
    }
  }
  // black pieces
  for (let row = size - 3; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if ((row + col) % 2 === 1) board[row][col] = "b";
    }
  }
}

function renderBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "light" : "dark");

      const piece = board[row][col];
      if (piece !== ".") {
        const pieceDiv = document.createElement("div");
        pieceDiv.classList.add("piece");
        if (piece.toLowerCase() === "r") pieceDiv.classList.add("red");
        if (piece.toLowerCase() === "b") pieceDiv.classList.add("black");
        if (piece === "R" || piece === "B") pieceDiv.classList.add("king");
        square.appendChild(pieceDiv);
      }

      if (selected && selected.row === row && selected.col === col) {
        square.classList.add("selected");
      }
      
      if (highlightedCells.some(([r, c]) => r === row && c === col)) {
        square.classList.add("highlight");
      }


      square.addEventListener("click", () => handleClick(row, col));
      boardDiv.appendChild(square);
    }
  }

  document.getElementById("turn").textContent = 
    `${currentPlayer.toUpperCase()}'s turn`;
}
//movement for pieces that are valid in the rows and col
function getValidMoves(row, col, piece) {
  let moves = [];
  const directions = (piece === "r") ? [[1, -1], [1, 1]] :
                     (piece === "b") ? [[-1, -1], [-1, 1]] :
                     [[1, -1], [1, 1], [-1, -1], [-1, 1]]; // kings

  for (let [dr, dc] of directions) {
    let r1 = row + dr, c1 = col + dc;
    let r2 = row + 2*dr, c2 = col + 2*dc;

    // move possibility
    if (inBounds(r1, c1) && board[r1][c1] === ".") {
      moves.push([r1, c1]);
    }

    // capture possibility
    if (inBounds(r2, c2) && isOpponent(piece, board[r1][c1]) && board[r2][c2] === ".") {
      moves.push([r2, c2]);
    }
  }
  return moves;
}


function handleClick(row, col) {
  if (!selected) {
    const piece = board[row][col];
    if (isCurrentPlayerPiece(piece)) {
      selected = { row, col };
       highlightedCells = getValidMoves(row, col, piece);
    }
  } else {
    if (tryMove(selected.row, selected.col, row, col)) {
      selected = null;
      highlightedCells = [];
    } else {
      const piece = board[row][col];
      if (isCurrentPlayerPiece(piece)) {
        selected = { row, col };
        clearHighlights();
         highlightedCells = getValidMoves(row, col, piece);
      } else {
        selected = null;
        clearHighlights();
      }
    }
  }
  renderBoard();
}


function isCurrentPlayerPiece(piece) {
  if (currentPlayer === "red") return piece === "r" || piece === "R";
  if (currentPlayer === "black") return piece === "b" || piece === "B";
  return false;
}

function clearHighlights() {
  highlightedCells.forEach(cell => cell.classList.remove("highlight"));
  highlightedCells = [];
}


function tryMove(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  if (piece === ".") return false;

  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;

  const isKing = piece === "R" || piece === "B";
  const forward = (piece === "r" || piece === "R") ? 1 : -1;

  // move the piece 
  if (Math.abs(colDiff) === 1 && (isKing || rowDiff === forward)) {
    if (board[toRow][toCol] === ".") {
      movePiece(fromRow, fromCol, toRow, toCol, piece);
      switchTurn();
      return true;
    }
  }

  // capturing 
  if (Math.abs(colDiff) === 2 && (isKing || rowDiff === 2 * forward)) {
    const jumpedRow = (fromRow + toRow) / 2;
    const jumpedCol = (fromCol + toCol) / 2;
    const jumpedPiece = board[jumpedRow][jumpedCol];

    if (isOpponent(piece, jumpedPiece) && board[toRow][toCol] === ".") {
      movePiece(fromRow, fromCol, toRow, toCol, piece);
      board[jumpedRow][jumpedCol] = ".";

      // chain reaction 
      if (canCaptureAgain(piece, toRow, toCol)) {
        selected = { row: toRow, col: toCol };
        return true;
      }

      switchTurn();
      return true;
    }
  }
  return false;
}

function movePiece(fromRow, fromCol, toRow, toCol, piece) {
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = ".";

  // geting the king
  if (piece === "r" && toRow === size - 1) board[toRow][toCol] = "R";
  if (piece === "b" && toRow === 0) board[toRow][toCol] = "B";
}

function canCaptureAgain(piece, row, col) {
  const isKing = piece === "R" || piece === "B";
  const directions = isKing
    ? [[1,1],[1,-1],[-1,1],[-1,-1]]
    : (piece === "r" ? [[1,1],[1,-1]] : [[-1,1],[-1,-1]]);

  for (let [dr, dc] of directions) {
    const enemyRow = row + dr;
    const enemyCol = col + dc;
    const landRow = row + 2*dr;
    const landCol = col + 2*dc;

    if (!inBounds(landRow, landCol)) continue;

    const enemy = board[enemyRow]?.[enemyCol];
    if (isOpponent(piece, enemy) && board[landRow][landCol] === ".") {
      return true;
    }
  }
  return false;
}

function isOpponent(piece, other) {
  if (!other || other === ".") return false;
  if ((piece === "r" || piece === "R") && (other === "b" || other === "B")) return true;
  if ((piece === "b" || piece === "B") && (other === "r" || other === "R")) return true;
  return false;
}

function switchTurn() {
  currentPlayer = (currentPlayer === "red") ? "black" : "red";

  if (!hasPieces(currentPlayer) || !hasMoves(currentPlayer)) {
    alert((currentPlayer === "red" ? "Black" : "Red") + " wins!");
  }
}

function hasPieces(player) {
  const symbols = player === "red" ? ["r","R"] : ["b","B"];
  return board.some(row => row.some(cell => symbols.includes(cell)));
}

function hasMoves(player) {
  const symbols = player === "red" ? ["r","R"] : ["b","B"];
  for (let row=0; row<size; row++) {
    for (let col=0; col<size; col++) {
      let piece = board[row][col];
      if (!symbols.includes(piece)) continue;

      const isKing = piece === "R" || piece === "B";
      const directions = isKing
        ? [[1,1],[1,-1],[-1,1],[-1,-1]]
        : (piece.toLowerCase() === "r" ? [[1,1],[1,-1]] : [[-1,1],[-1,-1]]);

      for (let [dr,dc] of directions) {
        let r1=row+dr, c1=col+dc;
        let r2=row+2*dr, c2=col+2*dc;

        if (inBounds(r1,c1) && board[r1][c1] === ".") return true;
        if (inBounds(r2,c2) && isOpponent(piece, board[r1]?.[c1]) && board[r2][c2] === ".") return true;
      }
    }
  }
  return false;
}

function inBounds(r, c) {
  return r>=0 && r<size && c>=0 && c<size;
}

initBoard();
renderBoard();

document.getElementById("resetbutton").addEventListener("click", () => {
  initBoard();
  currentPlayer = "red";
  selected = null;
  highlightedCells = [];
  renderBoard();
});
