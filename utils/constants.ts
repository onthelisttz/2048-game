export const GAME_WIDTH = 340;
export const GAME_HEIGHT = 480;

// Grid configuration - optimized for mobile
export const GRID_COLS = 5;
export const GRID_ROWS = 6;
export const CELL_SIZE = 62;
export const CELL_GAP = 2;
export const GRID_PADDING = 8;

// Calculate grid dimensions
export const GRID_WIDTH = GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_GAP + GRID_PADDING * 2;
export const GRID_HEIGHT = GRID_ROWS * CELL_SIZE + (GRID_ROWS - 1) * CELL_GAP + GRID_PADDING * 2;
export const GRID_OFFSET_Y = 0;

// Position grid at bottom center
export const GRID_START_X = (GAME_WIDTH - GRID_WIDTH) / 2 + GRID_PADDING;
export const GRID_START_Y = GAME_HEIGHT - GRID_HEIGHT - GRID_OFFSET_Y + GRID_PADDING;

export const DROP_Y = 35;
export const DANGER_LINE_ROW = 0; // Top row only (single danger row)

export const BLOCK_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: '#EEE4DA', text: '#776E65' },
  4: { bg: '#EDE0C8', text: '#776E65' },
  8: { bg: '#F2B179', text: '#F9F6F2' },
  16: { bg: '#F59563', text: '#F9F6F2' },
  32: { bg: '#F67C5F', text: '#F9F6F2' },
  64: { bg: '#F65E3B', text: '#F9F6F2' },
  128: { bg: '#EDCF72', text: '#F9F6F2' },
  256: { bg: '#EDCC61', text: '#F9F6F2' },
  512: { bg: '#EDC850', text: '#F9F6F2' },
  1024: { bg: '#EDC53F', text: '#F9F6F2' },
  2048: { bg: '#EDC22E', text: '#F9F6F2' },
};

export const getBlockColor = (value: number) => {
  return BLOCK_COLORS[value] || { bg: '#3C3A32', text: '#EDC22E' };
};

// Convert grid position to pixel position (center of cell)
export const gridToPixel = (col: number, row: number) => {
  return {
    x: GRID_START_X + col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    y: GRID_START_Y + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
  };
};

// Convert pixel position to grid column
export const pixelToCol = (x: number): number => {
  const relativeX = x - GRID_START_X;
  const col = Math.floor(relativeX / (CELL_SIZE + CELL_GAP));
  return Math.max(0, Math.min(GRID_COLS - 1, col));
};

export const SPAWN_VALUES = [2, 4, 8];

export const generateRandomValue = (): number => {
  const weights = [0.5, 0.35, 0.15];
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < SPAWN_VALUES.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return SPAWN_VALUES[i];
    }
  }

  return SPAWN_VALUES[0];
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
