import { hexFromUint8Array } from './buffer';

const FILENAME_MESS = 'C13CB3D23245817F3180BD77AEDF0EEF91A678E54F82C2FEB8B7BA34384C46B3';

export async function appFileName(appDataSeed: string): Promise<string> {
  let fileNameSeed = appDataSeed.substring(0, appDataSeed.length / 2);
  const enc = new TextEncoder();
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  const fileNameKey = await crypto.subtle.importKey('raw', enc.encode(fileNameSeed), algorithm, false, ['sign', 'verify']);
  const fileNameHash = await crypto.subtle.sign(algorithm.name, fileNameKey, enc.encode(FILENAME_MESS));
  const fileName = hexFromUint8Array(new Uint8Array(fileNameHash));
  return fileName + '.pswd';
}
