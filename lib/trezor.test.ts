import TrezorConnect, { Success } from "@trezor/connect-web";
import {
  ClearPasswordEntry,
  decryptAppData,
  decryptFullEntry,
  encryptAppData,
  encryptFullEntry,
  getEncryptionKey,
} from "./trezor";
import { TextDecoder, TextEncoder } from "util";
import { CipheredValue } from "@trezor/connect/lib/types/api/cipherKeyValue";
import { AppData } from "./storage";
import { SafePasswordEntry } from "../contexts/reducers/password_entries";

// nodeJs polyfills for WebAPIs
Object.assign(global, { TextDecoder, TextEncoder });
const crypto = require("node:crypto");
Object.defineProperty(global.self, "crypto", {
  value: {
    getRandomValues: (arr: any) => crypto.randomBytes(arr.length),
    subtle: crypto.webcrypto.subtle,
  },
});

jest.mock("@trezor/connect-web");
const mTrezorConnectCipherKeyValue = jest
  .mocked(TrezorConnect.cipherKeyValue)
  .mockName("Trezor Connect CipherKeyValue Mock");

function mTrezorConnectCipherKeyValueOfDefaultNonceReturnsCipherText(
  mTrezorConnectCipherKeyValue: any
) {
  // AES-256-CBC encryption of default text will be 128 characters long
  const CIPHER_TEXT =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  let encryptionPassKeyResponse: Success<CipheredValue> = {
    success: true,
    payload: {
      value: CIPHER_TEXT,
    },
  };
  //@ts-ignore
  mTrezorConnectCipherKeyValue.mockResolvedValue(encryptionPassKeyResponse);
}

function mTrezorConnectCipherKeyValueReturnsCipherText(
  mTrezorConnectCipherKeyValue: any
) {
  let encryptionPassKeyResponse: Success<CipheredValue> = {
    success: true,
    payload: {
      value: "safe_key",
    },
  };
  //@ts-ignore
  mTrezorConnectCipherKeyValue.mockResolvedValue(encryptionPassKeyResponse);
}

function mTrezorConnectCipherKeyValueReturnsDecryptedText(
  mTrezorConnectCipherKeyValue: any
) {
  const args = mTrezorConnectCipherKeyValue.mock.calls[0][0];
  //@ts-ignore
  const value = args.value;
  // return the same value that was encrypted by the trezor
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

it("can generate valid key derived from trezor that can encrypt and decrypt the app data", async () => {
  // The old trezor extension used the trezor to encrypt (AES-256-CBC) a constant value ( DEFAULT_NONCE )
  // The returned CipherText is deterministic to the account used on the trezor.
  // This is used to generate a key which will encrypt and decrypt the app data using AES-256-GCM

  // TrezorConnect.cipherKeyValue implementation defined by slip-0011 (AES-256-CBC)
  mTrezorConnectCipherKeyValueOfDefaultNonceReturnsCipherText(
    mTrezorConnectCipherKeyValue
  );
  // the key is used to encrypt and decrypt the app data
  const appDataKey = await getEncryptionKey("path");
  expect(appDataKey).toBeDefined();
  expect(appDataKey?.encryptionKey).toBeDefined();
  // array with 170 32 elements
  const expectedKey = new Uint8Array(32);
  expectedKey.fill(170); // hex value aa is 170
  expect(appDataKey?.encryptionKey).toEqual(new Uint8Array(expectedKey));
  if (appDataKey === undefined || appDataKey?.encryptionKey === undefined) {
    return;
  }
  const safeEntry: SafePasswordEntry = {
    key: "test",
    title: "test",
    item: "test",
    username: "username",
    passwordEnc: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    secretNoteEnc: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    tags: "tags",
    safeKey:
      "Base64 encoded AES-256-CBC key - it needs to be unlocked by the trezor for the password to be decrypted",
    createdDate: 0,
    lastModifiedDate: 0,
  };
  const appData: AppData = {
    tags: [],
    entries: [safeEntry],
    version: 1,
  };

  const result = await encryptAppData(appData, appDataKey.encryptionKey);
  expect(result).toBeDefined();
  if (result === undefined) {
    return;
  }

  // must be called after encryptAppData
  mTrezorConnectCipherKeyValueReturnsDecryptedText(
    mTrezorConnectCipherKeyValue
  );

  const decryptedAppData = await decryptAppData(
    result,
    appDataKey.encryptionKey
  );
  expect(decryptedAppData).toBeDefined();
  if (decryptedAppData === undefined) {
    return;
  }
  expect(decryptedAppData.entries).toEqual(appData.entries);
  expect(decryptedAppData.version).toEqual(appData.version);
});

it("encrypt then decrypt result in the same value", async () => {
  // Passwords are encrypted by a random key generated each time the password is changed.
  // This passKey is encrypted by the trezor and stored online. The original key is discarded.
  // Therefore, to unlock the password the saved key must be decrypted by the trezor before its used.

  // This test will encrypt and decrypt a password - only the trezor encryption is mocked
  // which is used to encrypt the passKey (AES key) that is used to encrypt the password
  const clearPasswordEntry: ClearPasswordEntry = {
    key: "test",
    title: "test",
    item: "test",
    username: "username",
    password: "password",
    safeNote: "safeNote",
    tags: "tags",
    createdDate: 0,
    lastModifiedDate: 0,
  };
  // This method of TrezorConnect is responsible for symmetric encryption and decryption
  // It is used to encrypt the "passKey", AES key that is used to encrypt the clear password entry
  // The "SafeKey" is stored online, and it must be decrypted by the trezor in order to unlock safe entries
  // this is the mechanism that was used in the original implementation of TrezorPasswordManager
  mTrezorConnectCipherKeyValueReturnsCipherText(mTrezorConnectCipherKeyValue);
  const result = await encryptFullEntry(clearPasswordEntry);
  expect(result).toBeDefined();
  if (result === undefined) {
    return;
  }
  // must be called after encryptAppData
  mTrezorConnectCipherKeyValueReturnsDecryptedText(
    mTrezorConnectCipherKeyValue
  );

  const decrypted = await decryptFullEntry(result);
  expect(decrypted).toBeDefined();
  expect(decrypted?.key).toBe(clearPasswordEntry.key);
  expect(decrypted?.title).toBe(clearPasswordEntry.title);
  expect(decrypted?.item).toBe(clearPasswordEntry.item);
  expect(decrypted?.username).toBe(clearPasswordEntry.username);
  expect(decrypted?.password).toBe(clearPasswordEntry.password);
  expect(decrypted?.safeNote).toBe(clearPasswordEntry.safeNote);
});
