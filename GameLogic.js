// GameLogic.js - Logique complète de placement intelligent des dominos

export class GameLogic {
  
  // ══════════════════════════════════════════════════════════════════════════════
  // PLACEMENT INTELLIGENT DES DOMINOS
  // ══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Calculer la disposition optimale des dominos sur le plateau
   * Implémente la logique : ligne droite -> serpent -> L/U selon l'espace
   */
  static calculateBoardLayout(board, boardSize = { w: 800, h: 400 }) {
    if (!board || board.length === 0) return [];
    
    const positions = [];
    const config = {
      DOMINO_WIDTH: 100,
      DOMINO_HEIGHT: 50,
      DOUBLE_WIDTH: 50,
      DOUBLE_HEIGHT: 100,
      SPACING: 8,
      MARGIN: 20,
      LINE_SPACING: 80,
    };
    
    // Point de départ au centre
    let currentX = boardSize.w / 2 - config.DOMINO_WIDTH / 2;
    let currentY = boardSize.h / 2 - config.DOMINO_HEIGHT / 2;
    let direction = 1; // 1 = droite, -1 = gauche
    let currentLine = 0;
    
    board.forEach((piece, index) => {
      const values = this.extractDominoValues(piece);
      const isDouble = values.a === values.b;
      
      // Premier domino : toujours au centre
      if (index === 0) {
        positions.push({
          x: currentX,
          y: currentY,
          rotation: 0,
          width: config.DOMINO_WIDTH,
          height: config.DOMINO_HEIGHT
        });
        currentX += config.DOMINO_WIDTH + config.SPACING;
        return;
      }
      
      // Calculer les dimensions selon le type
      let width = isDouble ? config.DOUBLE_WIDTH : config.DOMINO_WIDTH;
      let height = isDouble ? config.DOUBLE_HEIGHT : config.DOMINO_HEIGHT;
      let rotation = isDouble ? 90 : 0;
      
      // Vérifier si on dépasse les limites (formation en serpent)
      if (currentX + width > boardSize.w - config.MARGIN) {
        // Nouvelle ligne - formation en serpent
        currentLine++;
        currentY += direction > 0 ? config.LINE_SPACING : -config.LINE_SPACING;
        currentX = config.MARGIN;
        direction *= -1; // Changer de direction
      }
      
      // Si on dépasse aussi en hauteur, former un "L" ou "U"
      if (currentY + height > boardSize.h - config.MARGIN || currentY < config.MARGIN) {
        // Formation en "L" - tourner à 90°
        if (currentLine % 4 < 2) {
          currentX += config.LINE_SPACING;
          currentY = config.MARGIN;
          direction = 1;
        } else {
          currentX -= config.LINE_SPACING;
          currentY = boardSize.h - config.MARGIN - height;
          direction = -1;
        }
      }
      
      positions.push({
        x: currentX,
        y: currentY,
        rotation: rotation,
        width: width,
        height: height
      });
      
      // Avancer pour le prochain domino
      currentX += (width + config.SPACING) * direction;
    });
    
    return positions;
  }
  
  /**
   * Extraire les valeurs d'un domino (compatible avec différents formats)
   */
  static extractDominoValues(piece) {
    if (Array.isArray(piece)) {
      return { a: piece[0], b: piece[1] };
    }
    if (piece.piece && Array.isArray(piece.piece)) {
      return { a: piece.piece[0], b: piece.piece[1] };
    }
    if (typeof piece.a !== 'undefined' && typeof piece.b !== 'undefined') {
      return { a: piece.a, b: piece.b };
    }
    console.warn('Format de domino non reconnu:', piece);
    return { a: 0, b: 0 };
  }
  
  /**
   * Vérifier si un domino peut être placé sur le plateau
   */
  static canPlaceDomino(board, domino, boardEnds) {
    // Premier domino : toujours possible
    if (!board || board.length === 0) return true;
    
    // Vérifier les extrémités
    if (!boardEnds) return false;
    
    const values = Array.isArray(domino) ? domino : [domino[0], domino[1]];
    return values[0] === boardEnds.left || values[1] === boardEnds.left ||
           values[0] === boardEnds.right || values[1] === boardEnds.right;
  }
  
  /**
   * Vérifier si un domino peut être placé sur un côté spécifique
   */
  static canPlaceOnSide(board, domino, boardEnds, side) {
    if (!board || board.length === 0) return side === 'right'; // Premier domino à droite par convention
    if (!boardEnds) return false;
    
    const values = Array.isArray(domino) ? domino : [domino[0], domino[1]];
    
    if (side === 'left') {
      return values[0] === boardEnds.left || values[1] === boardEnds.left;
    } else if (side === 'right') {
      return values[0] === boardEnds.right || values[1] === boardEnds.right;
    }
    
    return false;
  }
  
  /**
   * Calculer les nouvelles extrémités après placement d'un domino
   */
  static calculateNewBoardEnds(board, newDomino, side, currentEnds) {
    if (!board || board.length === 0) {
      // Premier domino
      const values = this.extractDominoValues(newDomino);
      return { left: values.a, right: values.b };
    }
    
    if (!currentEnds) return null;
    
    const values = Array.isArray(newDomino) ? newDomino : [newDomino[0], newDomino[1]];
    const newEnds = { ...currentEnds };
    
    if (side === 'left') {
      // Placer à gauche
      if (values[0] === currentEnds.left) {
        newEnds.left = values[1];
      } else if (values[1] === currentEnds.left) {
        newEnds.left = values[0];
      }
    } else if (side === 'right') {
      // Placer à droite
      if (values[0] === currentEnds.right) {
        newEnds.right = values[1];
      } else if (values[1] === currentEnds.right) {
        newEnds.right = values[0];
      }
    }
    
    return newEnds;
  }
  
  /**
   * Vérifier si un domino doit être retourné pour le placement
   */
  static shouldFlipDomino(domino, boardEnds, side) {
    if (!boardEnds) return false;
    
    const values = Array.isArray(domino) ? domino : [domino[0], domino[1]];
    
    if (side === 'left') {
      return values[1] === boardEnds.left; // Retourner si la valeur de droite correspond
    } else if (side === 'right') {
      return values[0] === boardEnds.right; // Retourner si la valeur de gauche correspond
    }
    
    return false;
  }
  
  /**
   * Calculer le score d'une main
   */
  static calculateHandScore(hand) {
    if (!hand || !Array.isArray(hand)) return 0;
    
    return hand.reduce((total, domino) => {
      if (Array.isArray(domino)) {
        return total + domino[0] + domino[1];
      }
      const values = this.extractDominoValues(domino);
      return total + values.a + values.b;
    }, 0);
  }
  
  /**
   * Trouver tous les dominos jouables dans une main
   */
  static getPlayableDominos(hand, boardEnds) {
    if (!hand || !Array.isArray(hand)) return [];
    if (!boardEnds) return hand; // Tous jouables si premier coup
    
    return hand.filter(domino => this.canPlaceDomino([], domino, boardEnds));
  }
  
  /**
   * Vérifier si le jeu est bloqué
   */
  static isGameBlocked(hands, boardEnds) {
    if (!hands || !boardEnds) return false;
    
    return Object.values(hands).every(hand => 
      this.getPlayableDominos(hand, boardEnds).length === 0
    );
  }
  
  /**
   * Optimiser l'affichage pour différentes tailles d'écran
   */
  static optimizeLayoutForScreen(positions, screenWidth, screenHeight) {
    if (!positions || positions.length === 0) return positions;
    
    // Calculer les limites actuelles
    const bounds = positions.reduce((acc, pos) => ({
      minX: Math.min(acc.minX, pos.x),
      maxX: Math.max(acc.maxX, pos.x + pos.width),
      minY: Math.min(acc.minY, pos.y),
      maxY: Math.max(acc.maxY, pos.y + pos.height),
    }), {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    });
    
    // Calculer le facteur de zoom si nécessaire
    const layoutWidth = bounds.maxX - bounds.minX;
    const layoutHeight = bounds.maxY - bounds.minY;
    const scaleX = screenWidth / layoutWidth;
    const scaleY = screenHeight / layoutHeight;
    const scale = Math.min(1, Math.min(scaleX, scaleY) * 0.9); // 90% pour les marges
    
    // Centrer et redimensionner si nécessaire
    const offsetX = (screenWidth - layoutWidth * scale) / 2 - bounds.minX * scale;
    const offsetY = (screenHeight - layoutHeight * scale) / 2 - bounds.minY * scale;
    
    return positions.map(pos => ({
      ...pos,
      x: pos.x * scale + offsetX,
      y: pos.y * scale + offsetY,
      width: pos.width * scale,
      height: pos.height * scale,
    }));
  }
}
