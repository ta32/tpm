import TrezorConnect, {
  DEVICE_EVENT,
  DeviceEventMessage,
  DeviceUniquePath, TRANSPORT_EVENT, TransportEventMessage,
  UI_EVENT,
  UiEventMessage,
} from '@trezor/connect-web';
import { hexFromUint8Array, uint8ArrayFromHex } from './buffer';

import { AppData, deserializeObject, serializeObject, TrezorAppData } from './storage';

const BIP_44_COIN_TYPE_BTC = 0x80000000;
const SLIP_16_PATH = 10016;
const PATH = [(SLIP_16_PATH | BIP_44_COIN_TYPE_BTC) >>> 0, 0];
const DEFAULT_NONCE =
  '2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee';

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
  metaTitle?: string;
  username: string;
  passwordEnc: Uint8Array;
  secretNoteEnc: Uint8Array;
  safeKey: string;
  tags: string[];
  createdDate: number;
  lastModifiedDate: number;
  legacyMode: boolean;
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

export interface TrezorService {
  encryptAppData: typeof encryptAppData;
  decryptAppData: typeof decryptAppData;
  decryptTrezorAppData: typeof decryptTrezorAppData;
  encryptFullEntry: typeof encryptFullEntry;
  decryptFullEntry: typeof decryptFullEntry;
  getDevice: typeof getDevice;
  getEncryptionKey: typeof getEncryptionKey;
  initTrezor: typeof initTrezor;
  setTrezorDeviceEventHandler: typeof setTrezorDeviceEventHandler;
  setTrezorUiEventHandler: typeof setTrezorUiEventHandler;
  setTrezorTransportEventHandler: typeof setTrezorTransportEventHandler;
}

export const trezorServiceFactory = (): TrezorService => {
  return {
    encryptAppData,
    decryptAppData,
    decryptTrezorAppData,
    encryptFullEntry,
    decryptFullEntry,
    getDevice,
    getEncryptionKey,
    initTrezor,
    setTrezorDeviceEventHandler,
    setTrezorUiEventHandler,
    setTrezorTransportEventHandler,
  };
};

export async function initTrezor(appUrl: string, trustedHost: boolean) {
  await TrezorConnect.init({
    transportReconnect: true,
    debug: false,
    popup: !trustedHost,
    lazyLoad: false,
    coreMode: "iframe",
    manifest: {
      appName: 'Tmp Password Manager',
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

export function setTrezorDeviceEventHandler(deviceEventCallback: (event: DeviceEventMessage) => void) {
  TrezorConnect.on(DEVICE_EVENT, deviceEventCallback);
}
export function setTrezorUiEventHandler(uiEventCallback: (event: UiEventMessage) => void) {
  TrezorConnect.on(UI_EVENT, uiEventCallback);
}

export function setTrezorTransportEventHandler(transportEventCallback: (event: TransportEventMessage) => void) {
  TrezorConnect.on(TRANSPORT_EVENT, transportEventCallback);
}

export function trezorDispose() {
  TrezorConnect.dispose();
}

export function getDevice(deviceInfo: { label: string; model: string; deviceId: string }): TrezorDevice {
  return {
    appDataEncryptionKey: new Uint8Array(0),
    appDataSeed: '',
    path: '',
    label: deviceInfo.label,
    model: deviceInfo.model,
    deviceId: deviceInfo.deviceId,
  };
}

export async function getEncryptionKey(devicePath: string): Promise<AppDataKeys | null> {
  const result = await TrezorConnect.cipherKeyValue({
    device: {
      path: DeviceUniquePath(devicePath),
    },
    override: true,
    useEmptyPassphrase: true,
    path: PATH,
    key: getAppDataKey(),
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
  const passKey = await importAesGcmKey(key);
  return encryptWithKey(passKey, serializeObject(appData));
}

export async function decryptAppData(appDataCipherText: Uint8Array, key: Uint8Array): Promise<AppData | undefined> {
  const result = await decryptWithKey(await importAesGcmKey(key), appDataCipherText, false);
  return deserializeObject(result);
}

export async function decryptTrezorAppData(
  appDataCipherText: Uint8Array,
  key: Uint8Array
): Promise<TrezorAppData | undefined> {
  const result = await decryptWithKey(await importAesGcmKey(key), appDataCipherText, true);
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
    key: getEntryKey(entry.title, entry.username),
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
      legacyMode: false,
    };
  }
  return undefined;
}

export async function decryptFullEntry(
  entry: SafePasswordEntry,
  legacyMode: boolean
): Promise<ClearPasswordEntry | undefined> {
  const entryUnlockKey = entry.safeKey;
  const response = await TrezorConnect.cipherKeyValue({
    path: PATH,
    key: getEntryKey(entry.title, entry.username),
    value: entryUnlockKey,
    encrypt: false,
    askOnEncrypt: false,
    askOnDecrypt: true,
  });
  if (response.success) {
    const passKey = await importAesGcmKey(uint8ArrayFromHex(response.payload.value));
    const dec = new TextDecoder();
    const passwordClear = dec.decode(await decryptWithKey(passKey, entry.passwordEnc, legacyMode));
    const safeNoteClear = dec.decode(await decryptWithKey(passKey, entry.secretNoteEnc, legacyMode));
    return {
      key: entry.key,
      item: entry.item,
      title: entry.title,
      username: entry.username,
      password: legacyMode ? trimDoubleQuotes(passwordClear) : passwordClear,
      safeNote: legacyMode ? trimDoubleQuotes(safeNoteClear) : safeNoteClear,
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
  const { iv, cipherTextArray } = prepareForDecryption(cipherText, legacyMode);
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    cipherTextArray
  );
}

async function importAesGcmKey(key: Uint8Array) {
  return await crypto.subtle.importKey('raw', key, 'AES-GCM', true, ['encrypt', 'decrypt']);
}

function trimDoubleQuotes(str: string): string {
  return str.replace(/^"(.*)"$/, '$1');
}

function prepareForDecryption(
  cipherText: Uint8Array,
  legacyMode: boolean
): { iv: Uint8Array; cipherTextArray: Uint8Array } {
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

function getEntryKey(tile: string, username: string): string {
  // Entries must be decrypted with the same key that was used to encrypt them.
  return `Unlock ${tile} for user ${username}?`;
}

function getAppDataKey(): string {
  // Entries must be decrypted with the same key that was used to encrypt them.
  // Using the same key as the legacy Trezor Password Manager for backward compatibility
  return 'Activate TREZOR Password Manager?';
}
