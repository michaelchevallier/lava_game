export const GRID = {
  rows: 5,
  cols: 12,
  cellSize: 90,
  originX: 100,
  originY: 130,
};

export function cellToPixel(col, row) {
  return {
    x: GRID.originX + col * GRID.cellSize + GRID.cellSize / 2,
    y: GRID.originY + row * GRID.cellSize + GRID.cellSize / 2,
  };
}

export function pixelToCell(x, y) {
  const col = Math.floor((x - GRID.originX) / GRID.cellSize);
  const row = Math.floor((y - GRID.originY) / GRID.cellSize);
  if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) return null;
  return { col, row };
}

export function rowToY(row) {
  return GRID.originY + row * GRID.cellSize + GRID.cellSize / 2;
}

export function rightEdgeX() {
  return GRID.originX + GRID.cols * GRID.cellSize;
}

export function leftEdgeX() {
  return GRID.originX;
}

export function createGridState() {
  const cells = [];
  for (let r = 0; r < GRID.rows; r++) {
    cells.push(new Array(GRID.cols).fill(null));
  }
  return cells;
}

export function isEmpty(state, col, row) {
  if (col < 0 || col >= GRID.cols) return false;
  if (row < 0 || row >= GRID.rows) return false;
  return state[row][col] == null;
}

export function setCell(state, col, row, value) {
  if (col < 0 || col >= GRID.cols) return false;
  if (row < 0 || row >= GRID.rows) return false;
  state[row][col] = value;
  return true;
}

export function getCell(state, col, row) {
  if (col < 0 || col >= GRID.cols) return null;
  if (row < 0 || row >= GRID.rows) return null;
  return state[row][col];
}
