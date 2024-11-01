import TrezorConnect, {
  DEVICE_EVENT,
  DeviceEventMessage,
  TransportEventMessage,
  UI_EVENT,
  UiEventMessage,
} from '@trezor/connect-web';
import { hexFromUint8Array, uint8ArrayFromHex } from './buffer';

import { AppData, deserializeObject, serializeObject } from './storage';
import { TRANSPORT_EVENT } from '@trezor/connect/lib/events/transport';

const BIP_44_COIN_TYPE_BTC = 0x80000000;
const SLIP_16_PATH = 10016;
const PATH = [(SLIP_16_PATH | BIP_44_COIN_TYPE_BTC) >>> 0, 0];
const DEFAULT_NONCE =
  '2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee';
const DEFAULT_KEY_PHRASE = 'Activate TREZOR Password Manager?';

// AES-256-GCM
const IV_SIZE = 12;
const KEY_SIZE_BITS = 256;
const AUTH_SIZE = 128 / 8;

export interface TrezorDevice {
  label: string;
  model: string;
  deviceId: string;
  path: string;
  appDataSeed: string;
  appDataEncryptionKey: Uint8Array;
}
// TODO rename this to something else
export interface AppDataKeys {
  userAppDataSeed512Bit: string;
  userAppDataEncryptionKey: Uint8Array;
}
export interface SafePasswordEntry {
  key: string;
  item: string;
  title: string;
  username: string;
  passwordEnc: Uint8Array;
  secretNoteEnc: Uint8Array;
  safeKey: string;
  tags: string[];
  createdDate: number;
  lastModifiedDate: number;
}
export interface ClearPasswordEntry {
  key: string;
  item: string;
  title: string;
  username: string;
  password: string;
  safeNote: string;
  tags: string[];
  createdDate: number;
  lastModifiedDate: number;
}

export async function initTrezor(appUrl: string, trustedHost: boolean) {
  await TrezorConnect.init({
    transportReconnect: true,
    debug: false,
    popup: !trustedHost,
    lazyLoad: false,
    manifest: {
      email: 'test@gmail.com',
      appUrl: appUrl,
    },
  }).catch((error) => {
    return error;
  });
  if (!trustedHost) {
    // need to call a method that will prompt user to trust this host
    await TrezorConnect.requestLogin({
      challengeHidden: 'TmpPasswordManager',
      challengeVisual: 'Login to Tmp Password Manager',
    });
  }
}

export function setTrezorEventHandlers(
  deviceEventCallback: (event: DeviceEventMessage) => void,
  transportEventCallback: (event: TransportEventMessage) => void,
  uiEventCallback: (event: UiEventMessage) => void
) {
  TrezorConnect.on(DEVICE_EVENT, deviceEventCallback);
  TrezorConnect.on(TRANSPORT_EVENT, transportEventCallback);
  TrezorConnect.on(UI_EVENT, uiEventCallback);
}

export async function trezorDispose() {
  await TrezorConnect.dispose();
}

export async function getDevices(): Promise<TrezorDevice | null> {
  const result = await TrezorConnect.getFeatures();
  if (result.success) {
    let { unlocked, label, model, device_id } = result.payload;
    return {
      appDataEncryptionKey: new Uint8Array(),
      appDataSeed: '',
      path: '',
      label: label ?? '',
      model: model ?? '1',
      deviceId: device_id ?? '',
    };
  }
  return null;
}

export async function getEncryptionKey(devicePath: string): Promise<AppDataKeys | null> {
  const result = await TrezorConnect.cipherKeyValue({
    device: {
      path: devicePath,
    },
    override: true,
    useEmptyPassphrase: true,
    path: PATH,
    key: DEFAULT_KEY_PHRASE,
    value: DEFAULT_NONCE,
    encrypt: true,
    askOnEncrypt: true,
    askOnDecrypt: true,
  });
  if (result.success) {
    const tmp = result.payload.value;
    return {
      userAppDataSeed512Bit: result.payload.value,
      userAppDataEncryptionKey: uint8ArrayFromHex(tmp.substring(tmp.length / 2, tmp.length)),
    };
  }
  return null;
}

export async function encryptAppData(appData: AppData, key: Uint8Array): Promise<Uint8Array> {
  const passKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', true, ['encrypt', 'decrypt']);
  return encryptWithKey(passKey, serializeObject(appData));
}

export async function decryptAppData(appDataCipherText: Uint8Array, key: Uint8Array, legacyMode: boolean): Promise<AppData | undefined> {
  const passKey = await crypto.subtle.importKey('raw', key, 'AES-GCM', true, ['encrypt', 'decrypt']);
  const result = await decryptWithKey(passKey, appDataCipherText, legacyMode);
  return deserializeObject(result);
}

export async function encryptFullEntry(entry: ClearPasswordEntry): Promise<SafePasswordEntry | undefined> {
  let passKey = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: KEY_SIZE_BITS,
    },
    true,
    ['encrypt', 'decrypt']
  );
  let response = await TrezorConnect.cipherKeyValue({
    path: PATH,
    key: `Unlock ${entry.title} for username ${entry.username}?`,
    value: hexFromUint8Array(new Uint8Array(await crypto.subtle.exportKey('raw', passKey))),
    askOnEncrypt: false,
    askOnDecrypt: true,
    encrypt: true,
  });
  if (response.success) {
    const enc = new TextEncoder();
    const passEnc = await encryptWithKey(passKey, enc.encode(entry.password));
    const safeNoteEnc = await encryptWithKey(passKey, enc.encode(entry.safeNote));
    return {
      key: entry.key,
      item: entry.item,
      title: entry.title,
      username: entry.username,
      passwordEnc: passEnc,
      secretNoteEnc: safeNoteEnc,
      safeKey: response.payload.value, // passKey encrypted with Trezor
      tags: entry.tags,
      createdDate: entry.createdDate,
      lastModifiedDate: entry.lastModifiedDate,
    };
  }
  return undefined;
}

export async function decryptFullEntry(entry: SafePasswordEntry, legacyMode: boolean): Promise<ClearPasswordEntry | undefined> {
  const entryUnlockKey = entry.safeKey;
  const response = await TrezorConnect.cipherKeyValue({
    path: PATH,
    key: `Unlock ${entry.title} for user ${entry.username}?`,
    value: entryUnlockKey,
    encrypt: false,
    askOnEncrypt: false,
    askOnDecrypt: true,
  });
  if (response.success) {
    const passKey = await crypto.subtle.importKey('raw', uint8ArrayFromHex(response.payload.value), 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
    const dec = new TextDecoder();
    const passwordClear = dec.decode(await decryptWithKey(passKey, entry.passwordEnc, legacyMode));
    const safeNoteClear = dec.decode(await decryptWithKey(passKey, entry.secretNoteEnc, legacyMode));
    return {
      key: entry.key,
      item: entry.item,
      title: entry.title,
      username: entry.username,
      password: passwordClear,
      safeNote: safeNoteClear,
      tags: entry.tags,
      createdDate: entry.createdDate,
      lastModifiedDate: entry.lastModifiedDate,
    };
  }
  return undefined;
}

async function encryptWithKey(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  // https://github.com/mdn/dom-examples/blob/main/web-crypto/encrypt-decrypt/aes-gcm.js
  // The iv must never be reused with a given key.
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
  //  AES-GCM
  const cipherText = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  // prepend the IV to the ArrayBuffer
  const cipherTextWithIv = new Uint8Array(IV_SIZE + cipherText.byteLength);
  cipherTextWithIv.set(iv, 0);
  cipherTextWithIv.set(new Uint8Array(cipherText), IV_SIZE);
  return cipherTextWithIv;
}

async function decryptWithKey(key: CryptoKey, cipherText: Uint8Array, legacyMode: boolean): Promise<ArrayBuffer> {
  const { iv, cipherTextArray} = prepareForDecryption(cipherText, legacyMode);
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    cipherTextArray
  );
}

function prepareForDecryption(cipherText: Uint8Array, legacyMode: boolean): { iv: Uint8Array, cipherTextArray: Uint8Array} {
  // CipherText is prepended with the IV
  const iv = cipherText.slice(0, IV_SIZE);
  if (legacyMode) {
    // The auth tag is appended to the end of the cipherText when encrypted using the Trezor Password Manager (legacy mode)
    const authTag = cipherText.slice(IV_SIZE, IV_SIZE + AUTH_SIZE);
    const cipherTextArrayOnly = cipherText.slice(IV_SIZE + AUTH_SIZE, cipherText.byteLength);
    const cipherTextWithAuthTagAtEnd = new Uint8Array(cipherTextArrayOnly.byteLength + authTag.byteLength);
    cipherTextWithAuthTagAtEnd.set(cipherTextArrayOnly, 0);
    cipherTextWithAuthTagAtEnd.set(authTag, cipherTextArrayOnly.byteLength);
    return { iv, cipherTextArray: cipherTextWithAuthTagAtEnd };
  } else {
    const cipherTextArray = cipherText.slice(IV_SIZE, cipherText.byteLength);
    return { iv, cipherTextArray };
  }
}