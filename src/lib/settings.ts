export type FontSize = 'small' | 'normal' | 'large';

const FONT_KEY = 'kankor-fontsize';
const FONT_PX: Record<FontSize, string> = {
  small: '15px',
  normal: '17px',
  large: '19px',
};

export function getFontSize(): FontSize {
  return (localStorage.getItem(FONT_KEY) as FontSize) || 'normal';
}

export function applyFontSize(size: FontSize) {
  document.documentElement.style.fontSize = FONT_PX[size];
  localStorage.setItem(FONT_KEY, size);
}
