import { Book } from '@/types';

interface SpineStyle {
  backgroundColor: string;
  textColor: string;
  width: string; // e.g., '24px', '32px'
  pattern?: 'solid' | 'gradient' | 'texture';
}

// 落ち着いた、本らしい色のパレット
const SPINE_COLORS = [
  { bg: '#8B4513', text: '#FFD700' }, // SaddleBrown / Gold
  { bg: '#2F4F4F', text: '#FFFFFF' }, // DarkSlateGray / White
  { bg: '#556B2F', text: '#FFFFFF' }, // DarkOliveGreen / White
  { bg: '#800000', text: '#FFFFFF' }, // Maroon / White
  { bg: '#191970', text: '#FFFFFF' }, // MidnightBlue / White
  { bg: '#483D8B', text: '#FFFFFF' }, // DarkSlateBlue / White
  { bg: '#A0522D', text: '#FFFFFF' }, // Sienna / White
  { bg: '#006400', text: '#FFFFFF' }, // DarkGreen / White
  { bg: '#4682B4', text: '#FFFFFF' }, // SteelBlue / White
  { bg: '#D2691E', text: '#FFFFFF' }, // Chocolate / White
  { bg: '#CD853F', text: '#000000' }, // Peru / Black
  { bg: '#DEB887', text: '#000000' }, // BurlyWood / Black
  { bg: '#F5F5DC', text: '#000000' }, // Beige / Black
  { bg: '#E0FFFF', text: '#000000' }, // LightCyan / Black (文庫本っぽい)
  { bg: '#FFF0F5', text: '#000000' }, // LavenderBlush / Black
];

const WIDTH_OPTIONS = ['24px', '28px', '32px', '36px', '40px', '48px'];

/**
 * 文字列からハッシュ値を生成する
 */
const getHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * 本の情報から背表紙のスタイルを生成する
 * 同じ本（ISBNまたはタイトル）なら常に同じスタイルになるようにする
 */
export const generateSpineStyle = (book: Book): SpineStyle => {
  // シリーズタイトルがあればそれを、なければタイトルをシードにする（同じシリーズは同じ色）
  const seed = book.series_title || book.title;
  const hash = getHash(seed);

  // 色の決定
  const colorIndex = hash % SPINE_COLORS.length;
  const color = SPINE_COLORS[colorIndex];

  // 幅の決定 (すべて同じ幅にする)
  const width = '36px';

  return {
    backgroundColor: color.bg,
    textColor: color.text,
    width: width,
    pattern: 'solid',
  };
};
