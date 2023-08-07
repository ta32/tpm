import TrezorConnect, { DEVICE_EVENT, DeviceEventMessage } from '@trezor/connect-web';
import { hexFromUint8Array, uint8ArrayFromHex } from './buffer'

import { AppData, deserializeObject, serializeObject } from './storage'
import { SafePasswordEntry } from '../contexts/reducers/password_entries'

const BIP_44_COIN_TYPE_BTC = 0x80000000;
const SLIP_16_PATH = 10016;
const PATH = [(SLIP_16_PATH | BIP_44_COIN_TYPE_BTC) >>> 0, 0];
const DEFAULT_NONCE ='2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee';
const DEFAULT_KEY_PHRASE = 'Activate Temp Password Manager?';

// AES-256-GCM
const IV_SIZE = 12;
const KEY_SIZE_BITS = 256;

export interface TrezorDevice {
  label: string;
  model: string;
  deviceId: string;
  path: string;
  masterKey: string;
  encryptionKey: Uint8Array;
}

export interface KeyPair {
  masterKey: string;
  encryptionKey: Uint8Array;
}

export interface ClearPasswordEntry {
  key: string;
  item: string;
  title: string;
  username: string;
  password: string;
  safeNote: string;
  tags: string;
}

export async function initTrezor(deviceEventCallback: (event: DeviceEventMessage) => void) {
  await TrezorConnect.init({
    transportReconnect: true,
    debug: false,
    popup: false,
    lazyLoad: false,
    manifest: {
      email: 'test@gmail.com',
      appUrl: 'http://localhost:3000'
    },
  }).catch((error) => {
    return error;
  });
  TrezorConnect.on(DEVICE_EVENT, deviceEventCallback);
}

export async function getDevices(): Promise<TrezorDevice|null> {
  const result = await TrezorConnect.getFeatures();
  if (result.success) {
    let {
      unlocked,
      label,
      model,
      device_id,
    } = result.payload;
    return {
      encryptionKey: new Uint8Array(),
      masterKey: '',
      path: '',
      label: label ?? '',
      model: model ?? '1',
      deviceId: device_id ?? ''
    }
  }
  return null;
}

export async function getEncryptionKey(devicePath: string): Promise<KeyPair|null> {
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
    askOnDecrypt: true
  })
  if (result.success) {
    const tmp = result.payload.value;
    return {
      masterKey: result.payload.value, // assumes master key is 128 bytes long
      encryptionKey: uint8ArrayFromHex(tmp.substring(tmp.length/2, tmp.length))
    }
  }
  return null;
}

export async function encryptAppData(appData: AppData, key: Uint8Array): Promise<Uint8Array> {
  const passKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
  return encryptWithKey(passKey, serializeObject(appData));
}

export async function decryptAppData(appDataCipherText: Uint8Array, key: Uint8Array): Promise<AppData|undefined> {
  const passKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
  const result = await decryptWithKey(passKey, appDataCipherText)
  return deserializeObject(result);
}

export async function encryptFullEntry(entry: ClearPasswordEntry): Promise<SafePasswordEntry|undefined> {
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
      tags: entry.tags
    }
  }
  return undefined;
}

export async function decryptFullEntry(entry: SafePasswordEntry): Promise<ClearPasswordEntry|undefined> {
  const entryUnlockKey = entry.safeKey;
  const response = await TrezorConnect.cipherKeyValue({
    path: PATH,
    key: `Unlock ${entry.title} for username ${entry.username}?`,
    value: entryUnlockKey,
    encrypt: false,
    askOnEncrypt: false,
    askOnDecrypt: true,
  });
  if (response.success) {
    const passKey = await crypto.subtle.importKey(
      'raw',
      uint8ArrayFromHex(response.payload.value),
      "AES-GCM",
      false,
      ['encrypt', 'decrypt']
    );
    const dec = new TextDecoder();
    const passwordClear = dec.decode(await decryptWithKey(passKey, entry.passwordEnc));
    const safeNoteClear = dec.decode(await decryptWithKey(passKey, entry.secretNoteEnc));
    return {
      key: entry.key,
      item: entry.item,
      title: entry.title,
      username: entry.username,
      password: passwordClear,
      safeNote: safeNoteClear,
      tags: entry.tags
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

async function decryptWithKey(key: CryptoKey, cipherText: Uint8Array): Promise<ArrayBuffer> {
  // CipherText is prepended with the IV
  const iv = cipherText.slice(0, IV_SIZE);
  const cipherTextArray = cipherText.slice(IV_SIZE, cipherText.byteLength);
  // The iv value is the same as that used for encryption
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    cipherTextArray
  );
}
