// ─── Calcul position/rotation domino sur plateau CORRIGÉ ──────────────────────
const DOMINO_W = 60; // largeur domino horizontal (unités relatives)
const DOMINO_H = 30; // hauteur domino horizontal
const SPACING = 2;   // espace entre dominos
const BOARD_W = 800;
const BOARD_H = 500;
const MARGIN = 40;

function initLayout() {
  const centerX = Math.floor((BOARD_W - DOMINO_W) / 2);
  const centerY = Math.floor((BOARD_H - DOMINO_H) / 2);
  
  return {
    // Position du premier domino (centre)
    firstX: centerX,
    firstY: centerY,
    // Prochaines positions
    nextRightX: centerX + DOMINO_W + SPACING,
    nextRightY: centerY,
    nextLeftX: centerX - DOMINO_W - SPACING,
    nextLeftY: centerY,
    // Directions actuelles
    rightDirection: 'right', // right, down, left, up
    leftDirection: 'left',
    // Limites pour les virages
    rightBoundary: BOARD_W - MARGIN,
    leftBoundary: MARGIN,
    topBoundary: MARGIN,
    bottomBoundary: BOARD_H - MARGIN,
  };
}

function getNextPosition(layout, side, isDouble = false) {
  let x, y, rotation = 0;
  
  if (side === 'center') {
    // Premier domino au centre
    x = layout.firstX;
    y = layout.firstY;
    rotation = isDouble ? 90 : 0;
    return { x, y, rotation };
  }
  
  if (side === 'right') {
    x = layout.nextRightX;
    y = layout.nextRightY;
    
    switch (layout.rightDirection) {
      case 'right':
        rotation = isDouble ? 90 : 0;
        // Vérifier si on dépasse la limite droite
        if (x + DOMINO_W > layout.rightBoundary) {
          // Virage vers le bas
          rotation = 90;
          layout.nextRightX = x;
          layout.nextRightY = y + DOMINO_W + SPACING;
          layout.rightDirection = 'down';
        } else {
          layout.nextRightX = x + DOMINO_W + SPACING;
        }
        break;
        
      case 'down':
        rotation = 90;
        layout.nextRightY = y + DOMINO_W + SPACING;
        // Vérifier limite bas
        if (layout.nextRightY > layout.bottomBoundary) {
          layout.rightDirection = 'left';
          layout.nextRightX = x - DOMINO_W - SPACING;
          layout.nextRightY = y;
        }
        break;
        
      case 'left':
        rotation = 0;
        layout.nextRightX = x - DOMINO_W - SPACING;
        break;
    }
  } else { // side === 'left'
    x = layout.nextLeftX;
    y = layout.nextLeftY;
    
    switch (layout.leftDirection) {
      case 'left':
        rotation = isDouble ? 90 : 0;
        // Vérifier limite gauche
        if (x < layout.leftBoundary) {
          // Virage vers le bas
          rotation = 90;
          layout.nextLeftX = x;
          layout.nextLeftY = y + DOMINO_W + SPACING;
          layout.leftDirection = 'down';
        } else {
          layout.nextLeftX = x - DOMINO_W - SPACING;
        }
        break;
        
      case 'down':
        rotation = 90;
        layout.nextLeftY = y + DOMINO_W + SPACING;
        break;
    }
  }
  
  // Les doubles sont toujours verticaux
  if (isDouble) rotation = 90;
  
  return { x, y, rotation };
}
