/**
 * OOTD – kuratierte Beispiel-Garderobe im Preppy-/Old-Money-Stil.
 *
 * Bewusst so zusammengestellt, dass die Engine ab Phase 3 sofort
 * mehrere stimmige Kombinationen findet: viele neutrale Basisteile,
 * wenige Akzentfarben, höchstens ein lautes Muster pro Teil.
 */

export const SEED_GARMENTS = [
  { name: 'Oxford-Hemd, hellblau', category: 'top', subtype: 'Oxford-Hemd',
    color: '#A8C3D7', pattern: 'solid', patternColor: null, formality: 2, warmth: 1 },
  { name: 'Weißes Button-down', category: 'top', subtype: 'Button-down-Hemd',
    color: '#FAFAF7', pattern: 'solid', patternColor: null, formality: 3, warmth: 1 },
  { name: 'Polohemd Navy', category: 'top', subtype: 'Polohemd',
    color: '#22334E', pattern: 'solid', patternColor: null, formality: 1, warmth: 1 },
  { name: 'Kaschmirpullover Creme', category: 'top', subtype: 'Kaschmirpullover',
    color: '#F2E9DC', pattern: 'cable', patternColor: '#E4D8C4', formality: 2, warmth: 3 },
  { name: 'Argyle-Cardigan', category: 'top', subtype: 'Cardigan',
    color: '#2E4B3C', pattern: 'argyle', patternColor: '#D6C7A9', formality: 2, warmth: 2 },
  { name: 'Rollkragen Burgund', category: 'top', subtype: 'Rollkragenpullover',
    color: '#7A2E2E', pattern: 'solid', patternColor: null, formality: 2, warmth: 3 },

  { name: 'Chino Camel', category: 'bottom', subtype: 'Chino',
    color: '#C19A6B', pattern: 'solid', patternColor: null, formality: 2, warmth: 2 },
  { name: 'Chino Navy', category: 'bottom', subtype: 'Chino',
    color: '#22334E', pattern: 'solid', patternColor: null, formality: 2, warmth: 2 },
  { name: 'Anzughose mit Längsstreifen', category: 'bottom', subtype: 'Anzughose',
    color: '#8C8C88', pattern: 'pinstripe', patternColor: '#F2E9DC', formality: 3, warmth: 2 },
  { name: 'Cordhose Braun', category: 'bottom', subtype: 'Cordhose',
    color: '#5B4636', pattern: 'solid', patternColor: null, formality: 2, warmth: 3 },
  { name: 'Flanellhose Grau', category: 'bottom', subtype: 'Flanellhose',
    color: '#8C8C88', pattern: 'solid', patternColor: null, formality: 3, warmth: 3 },

  { name: 'Navy-Blazer', category: 'outer', subtype: 'Blazer',
    color: '#22334E', pattern: 'solid', patternColor: null, formality: 3, warmth: 2 },
  { name: 'Tweed-Sakko', category: 'outer', subtype: 'Tweed-Sakko',
    color: '#8C8C88', pattern: 'houndstooth', patternColor: '#5B4636', formality: 3, warmth: 3 },
  { name: 'Camel Coat', category: 'outer', subtype: 'Camel Coat',
    color: '#C19A6B', pattern: 'solid', patternColor: null, formality: 3, warmth: 3 },
  { name: 'Steppweste Salbei', category: 'outer', subtype: 'Steppweste',
    color: '#9CAF88', pattern: 'solid', patternColor: null, formality: 1, warmth: 2 },

  { name: 'Penny-Loafer Braun', category: 'shoes', subtype: 'Penny-Loafer',
    color: '#5B4636', pattern: 'solid', patternColor: null, formality: 2, warmth: 2 },
  { name: 'Oxford-Schuhe Schwarz', category: 'shoes', subtype: 'Oxford-Schuhe',
    color: '#23211E', pattern: 'solid', patternColor: null, formality: 3, warmth: 2 },
  { name: 'Weiße Sneaker', category: 'shoes', subtype: 'Weiße Sneaker',
    color: '#FAFAF7', pattern: 'solid', patternColor: null, formality: 1, warmth: 1 },

  { name: 'Einstecktuch Senf', category: 'accessory', subtype: 'Einstecktuch',
    color: '#C9A227', pattern: 'polkadot', patternColor: '#F2E9DC', formality: 2, warmth: 1 },
  { name: 'Krawatte Burgund', category: 'accessory', subtype: 'Krawatte',
    color: '#7A2E2E', pattern: 'stripes', patternColor: '#22334E', formality: 3, warmth: 1 },
  { name: 'Ledergürtel Braun', category: 'accessory', subtype: 'Ledergürtel',
    color: '#5B4636', pattern: 'solid', patternColor: null, formality: 2, warmth: 1 },
  { name: 'Strickschal Racing Green', category: 'accessory', subtype: 'Strickschal',
    color: '#2E4B3C', pattern: 'stripes', patternColor: '#D6C7A9', formality: 1, warmth: 3 },
];
