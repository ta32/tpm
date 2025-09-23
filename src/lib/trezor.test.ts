import { describe, expect, it } from '@jest/globals';
import TrezorConnect, { Success } from '@trezor/connect-web';
import {
  AppDataKeys,
  ClearPasswordEntry,
  decryptAppData,
  decryptFullEntry,
  encryptAppData,
  encryptFullEntry,
  getDevice,
  getEncryptionKey,
  SafePasswordEntry,
} from './trezor';
import { TextDecoder, TextEncoder } from 'util';
import { CipheredValue } from '@trezor/connect/lib/types/api/cipherKeyValue';
import { AppData } from './storage';

// nodeJs polyfills for WebAPIs
Object.assign(global, { TextDecoder, TextEncoder });
const crypto = require('node:crypto');
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: (arr: any) => crypto.randomBytes(arr.length),
    subtle: crypto.webcrypto.subtle,
  },
});

jest.mock('@trezor/connect-web');
const mTrezorConnectCipherKeyValue = jest
  .mocked(TrezorConnect.cipherKeyValue)
  .mockName('Trezor Connect CipherKeyValue Mock');

function mTrezorConnectCipherKeyValueOfDefaultNonceReturnsCipherText(mTrezorConnectCipherKeyValue: any) {
  // AES-256-CBC encryption of default text will be 128 characters long
  const CIPHER_TEXT =
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  let encryptionPassKeyResponse: Success<CipheredValue> = {
    success: true,
    payload: {
      value: CIPHER_TEXT,
    },
  };
  //@ts-ignore
  mTrezorConnectCipherKeyValue.mockResolvedValue(encryptionPassKeyResponse);
}

function mTrezorConnectCipherKeyValueReturnsCipherText(mTrezorConnectCipherKeyValue: any) {
  let cipherText: Success<CipheredValue> = {
    success: true,
    payload: {
      value: 'cipher text, of the encrypted key that was used to encrypt the password client side',
    },
  };
  //@ts-ignore
  mTrezorConnectCipherKeyValue.mockResolvedValue(cipherText);
}

function mTrezorConnectCipherKeyValueReturnsDecryptedText(mTrezorConnectCipherKeyValue: any) {
  const args = mTrezorConnectCipherKeyValue.mock.calls[0][0];
  //@ts-ignore
  const value = args.value;
  // return the same value that was encrypted by the trezor connect cipherKeyValue method
  const decryptedPassKeyResponse: Success<CipheredValue> = {
    success: true,
    payload: {
      value: value,
    },
  };
  //@ts-ignore
  mTrezorConnectCipherKeyValue.mockResolvedValue(decryptedPassKeyResponse);
}
afterEach(() => {
  jest.clearAllMocks();
});

describe('decryptAppData', () => {
  function withDevice() {
    const payload: any = {
      label: 'Slurp1',
      name: '',
      path: '1234',
      type: 'acquired',
    };
    return getDevice(payload);
  }
  function withAppData() {
    const safeEntry: SafePasswordEntry = {
      key: 'test',
      title: 'test',
      item: 'test',
      username: 'username',
      passwordEnc: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      secretNoteEnc: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      tags: ['tags'],
      safeKey:
        'Base64 encoded AES-256-CBC key - it needs to be unlocked by the trezor for the password to be decrypted',
      createdDate: 0,
      lastModifiedDate: 0,
      legacyMode: false,
      modelVersion: '1',
    };
    const appData: AppData = {
      tags: [],
      entries: [safeEntry],
      version: 1,
      modelVersion: '1',
    };
    return appData;
  }

  async function encryptAppDataAndSetupEchoOfEncryptionKey(appData: AppData, appDataKey: AppDataKeys) {
    const result = await encryptAppData(appData, appDataKey.userAppDataEncryptionKey);
    expect(result).toBeDefined();
    // must be called after encryptAppData
    mTrezorConnectCipherKeyValueReturnsDecryptedText(mTrezorConnectCipherKeyValue);
    return result;
  }
  async function setupMockToAllowGetEncryptionKeyToReturnDeterministicKey() {
    // The old trezor extension used the trezor to encrypt (AES-256-CBC) a constant value ( DEFAULT_NONCE )
    // The returned CipherText is deterministic to the account used on the trezor.
    // This is used to generate a key which will encrypt and decrypt the app data using AES-256-GCM

    // TrezorConnect.cipherKeyValue implementation defined by slip-0011 (AES-256-CBC)
    mTrezorConnectCipherKeyValueOfDefaultNonceReturnsCipherText(mTrezorConnectCipherKeyValue);
    // this is a payload we get from the trezor connect event callbacks
    const device = withDevice();
    // device path must not be empty
    expect(device).toBeDefined();
    // the pathId is required to identify the device when connecting to an unacquired device, but optional for acquired devices
    expect(device.pathId).toBe('1234');
    // the key is used to encrypt and decrypt the app data
    const appDataKey = await getEncryptionKey(device);
    expect(appDataKey).toBeDefined();
    expect(appDataKey?.userAppDataEncryptionKey).toBeDefined();
    // array with 170 32 elements
    const expectedKey = new Uint8Array(32);
    expectedKey.fill(170); // hex value aa is 170
    expect(appDataKey?.userAppDataEncryptionKey).toEqual(new Uint8Array(expectedKey));
    return appDataKey;
  }

  it('should be able to get appdata after encryptAppData using deterministic key', async () => {
    const appData = withAppData();
    const appDataKey = await setupMockToAllowGetEncryptionKeyToReturnDeterministicKey();
    const result = await encryptAppDataAndSetupEchoOfEncryptionKey(appData, appDataKey!);

    const decryptedAppData = await decryptAppData(result, appDataKey!.userAppDataEncryptionKey);

    expect(decryptedAppData).toBeDefined();
    expect(decryptedAppData!.entries).toEqual(appData.entries);
    expect(decryptedAppData!.version).toEqual(appData.version);
  });
});

describe('decryptFullEntry', () => {
  async function encryptFullEntryAndSetupEchoOfEncryptionKey(clearPasswordEntry: ClearPasswordEntry) {
    mTrezorConnectCipherKeyValueReturnsCipherText(mTrezorConnectCipherKeyValue);
    // encryptFullEntry will generate a random passKey (AES key) to encrypt the password entry
    // this key is encrypted by the TrezorConnect.cipherKeyValue method
    const result = await encryptFullEntry(clearPasswordEntry);
    expect(result).toBeDefined();
    // set the mock to echo the actual value of the AES key that was used to encrypt the password entry
    // so it can be decrypted by the client again
    mTrezorConnectCipherKeyValueReturnsDecryptedText(mTrezorConnectCipherKeyValue);
    return result;
  }

  it('should be able to decrypt clear password using client side generated key', async () => {
    // This test will encrypt and decrypt a password - only the trezor encryption is mocked.
    const clearPasswordEntry: ClearPasswordEntry = {
      key: 'test',
      title: 'test',
      item: 'test',
      username: 'username',
      password: 'password',
      safeNote: 'safeNote',
      tags: ['tags'],
      createdDate: 0,
      lastModifiedDate: 0,
    };
    const safeEntry = await encryptFullEntryAndSetupEchoOfEncryptionKey(clearPasswordEntry);

    const decrypted = await decryptFullEntry(safeEntry!, false);

    expect(decrypted).toBeDefined();
    expect(decrypted?.key).toBe(clearPasswordEntry.key);
    expect(decrypted?.title).toBe(clearPasswordEntry.title);
    expect(decrypted?.item).toBe(clearPasswordEntry.item);
    expect(decrypted?.username).toBe(clearPasswordEntry.username);
    expect(decrypted?.password).toBe(clearPasswordEntry.password);
    expect(decrypted?.safeNote).toBe(clearPasswordEntry.safeNote);
  });
});
