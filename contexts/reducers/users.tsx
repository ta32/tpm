// MODEL
import { TrezorDevice, KeyPair } from '../../lib/trezor'
import { Dropbox } from 'dropbox'

export enum UserStatus {
  LOADING,
  ONLINE_NO_TREZOR,
  ONLINE_WITH_TREZOR,
  SHOW_PIN_DIALOG,
  TREZOR_PIN_ENTERED,
  TPM_READY_TO_LOAD,
  OFFLINE
}
export interface User {
  status: UserStatus;
  device: TrezorDevice | null;
  dropboxAccountName: string;
  dbc: Dropbox | null;
}

// ACTIONS
export interface LoadingDropboxApiToken {
  type: "LOADING_DROPBOX_API_TOKEN"
}
export interface DropboxUserLoggedIn {
  type: "DROPBOX_USER_LOGGED_IN"
  userName: string;
  dbc: Dropbox;
}
export interface AddDevice {
  type: "ADD_DEVICE"
  device: TrezorDevice;
}
export interface RemoveDevice {
  type: "REMOVE_DEVICE"
}
export interface ShowPinDialog {
  type: "SHOW_PIN_DIALOG"
}
export interface DevicePinEntered {
  type: "DEVICE_PIN_ENTERED"
}
export interface ActivatedTmpOnDevice {
  type: "ACTIVATED_TMP_ON_DEVICE"
  keyPair: KeyPair;
}

export type UserAction = LoadingDropboxApiToken | DropboxUserLoggedIn | AddDevice | RemoveDevice | ShowPinDialog | ActivatedTmpOnDevice | DevicePinEntered;

export function userReducer(state: User, action: UserAction) : User {
  switch (action.type) {
    case "LOADING_DROPBOX_API_TOKEN": {
      return { ...state, status: UserStatus.LOADING };
    }
    case "DROPBOX_USER_LOGGED_IN": {
      if (state.device !== null) {
        return { ...state, status: UserStatus.ONLINE_WITH_TREZOR, dropboxAccountName: action.userName, dbc: action.dbc };
      } else {
        return { ...state, status: UserStatus.ONLINE_NO_TREZOR, dropboxAccountName: action.userName, dbc: action.dbc };
      }
    }
    case "ADD_DEVICE": {
      if (state.status === UserStatus.ONLINE_NO_TREZOR) {
        return { ...state, status: UserStatus.ONLINE_WITH_TREZOR, device: action.device };
      } else {
        return {...state, device: action.device};
      }
    }
    case "REMOVE_DEVICE": {
      if (state.status === UserStatus.ONLINE_WITH_TREZOR) {
        return { ...state, status: UserStatus.ONLINE_NO_TREZOR, device: null };
      } else {
        return {...state, device: null};
      }
    }
    case "SHOW_PIN_DIALOG": {
      return { ...state, status: UserStatus.SHOW_PIN_DIALOG };
    }
    case "DEVICE_PIN_ENTERED": {
      return { ...state, status: UserStatus.TREZOR_PIN_ENTERED };
    }
    case "ACTIVATED_TMP_ON_DEVICE": {
      if (state.device !== null) {
        const device: TrezorDevice = { ...state.device, masterKey: action.keyPair.masterKey, encryptionKey: action.keyPair.encryptionKey };
        return { ...state, device: device, status: UserStatus.TPM_READY_TO_LOAD };
      } else {
        return { ...state, status: UserStatus.ONLINE_NO_TREZOR, device: null };
      }
    }
  }
}
