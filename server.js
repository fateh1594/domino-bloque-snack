// server.js - Logique de placement universelle (CommonJS)
const DW = 200; 
const DH = 100; 
const PAD = 50;

function initLayout(boardW = 1000, boardH = 600) {
    const cx = Math.floor((boardW - DW) / 2);
    const cy = Math.floor((boardH - DH) / 2);
    return {
        boardW, boardH,
        rightX: cx + DW, rightY: cy,
        leftX: cx, leftY: cy,
        rightDir: 'right', leftDir: 'left',
    };
}

function getNextPosition(layout, side, isDouble) {
    let x, y, rotation = isDouble ? 90 : 0;
    if (side === 'right' || side === 'center') {
        x = layout.rightX; y = layout.rightY;
        if (layout.rightDir === 'right') {
            if (x + DW > layout.boardW - PAD) { 
                rotation = 90; x = layout.boardW - PAD - DH;
                layout.rightY += DW; layout.rightX = x; layout.rightDir = 'left';
            } else { layout.rightX += DW; }
        } else {
            x -= DW;
            if (x < PAD) { layout.rightY += DW; layout.rightX = PAD; layout.rightDir = 'right'; }
            else { layout.rightX = x; }
        }
    } else {
        if (layout.leftDir === 'left') {
            x = layout.leftX - DW; y = layout.leftY;
            if (x < PAD) {
                rotation = 90; x = PAD;
                layout.leftY -= DW; layout.leftX = x + DH; layout.leftDir = 'right';
            } else { layout.leftX = x; }
        } else {
            x = layout.leftX; y = layout.leftY;
            if (x + DW > layout.boardW - PAD) { layout.leftY -= DW; layout.leftX = x; layout.leftDir = 'left'; }
            else { layout.leftX += DW; }
        }
    }
    return { x, y, rotation };
}

module.exports = { initLayout, getNextPosition };
