
function int2hex(value: number): string {
  return value.toString(16).padStart(2, '0');
}
export function hexFromUint8Array(array: Uint8Array): string {
  return Array.from(array).map(int2hex).join('');
}

export function uint8ArrayFromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}
