const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIALS = "!@#$%^&*()_+;><.:";

function shuffleArray(array: string[]): string[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

function getRandomValues(length: number, charset: string): string[] {
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values).map(val => charset[val % charset.length]);
}

export default function generatePassword(length: number): string {
  if (length < 6) {
    throw new Error('Password length must be at least 6 characters.');
  }

  const specialsPart = getRandomValues(2, SPECIALS);
  const numbersPart = getRandomValues(4, NUMBERS);
  const lettersPart = getRandomValues(length - 6, LETTERS);

  const combined = specialsPart.concat(numbersPart, lettersPart);
  const shuffled = shuffleArray(combined);
  return shuffled.join('');
}
