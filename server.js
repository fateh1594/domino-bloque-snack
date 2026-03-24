const DW = 200; 
const DH = 100; 
const PAD = 40;

const initLayout = (boardW = 1000, boardH = 600) => {
  const cx = Math.floor((boardW - DW) / 2);
  const cy = Math.floor((boardH - DH) / 2);
  return {
    boardW, boardH,
    rightX: cx + DW, rightY: cy,
    leftX: cx, leftY: cy,
    rightDir: 'right', leftDir: 'left',
  };
};

const getNextPosition = (layout, side, isDouble) => {
  const l = layout;
  let x, y, rotation = isDouble ? 90 : 0;
  if (side === 'right' || side === 'center') {
    x = l.rightX; y = l.rightY;
    if (l.rightDir === 'right') {
      if (x + DW > l.boardW - PAD) { 
        rotation = 90; x = l.boardW - PAD - DH;
        l.rightY += DW; l.rightX = x; l.rightDir = 'left';
      } else { l.rightX += DW; }
    } else {
      x -= DW;
      if (x < PAD) { l.rightY += DW; l.rightX = PAD; l.rightDir = 'right'; }
      else { l.rightX = x; }
    }
  } else {
    if (l.leftDir === 'left') {
      x = l.leftX - DW; y = l.leftY;
      if (x < PAD) {
        rotation = 90; x = PAD;
        l.leftY -= DW; l.leftX = x + DH; l.leftDir = 'right';
      } else { l.leftX = x; }
    } else {
      x = l.leftX; y = l.leftY;
      if (x + DW > l.boardW - PAD) { l.leftY -= DW; l.leftX = x; l.leftDir = 'left'; }
      else { l.leftX += DW; }
    }
  }
  return { x, y, rotation };
};

module.exports = { initLayout, getNextPosition };
