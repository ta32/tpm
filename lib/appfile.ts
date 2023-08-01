import { hexFromUint8Array } from './buffer'

const FILENAME_MESS = 'C13CB3D23245817F3180BD77AEDF0EEF91A678E54F82C2FEB8B7BA34384C46B3';

export async function appFileName(masterPk: string) : Promise<string> {
  let fileKey = masterPk.substring(0, masterPk.length / 2);
  // createHmac('sha256', fileKey);
  const enc = new TextEncoder();
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(fileKey),
    algorithm,
    false,
    ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign(
    algorithm.name,
    cryptoKey,
    enc.encode(FILENAME_MESS)
  );
  const hexString = hexFromUint8Array(new Uint8Array(signature))
  return hexString + '.pswd';
}
