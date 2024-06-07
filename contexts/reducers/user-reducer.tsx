// MODEL
import { TrezorDevice, KeyPair } from '../../lib/trezor';
import { Dropbox } from 'dropbox';

export enum UserStatus {
  ONLINE_NO_TREZOR,
  ONLINE_WITH_TREZOR,
  TREZOR_REQ_PIN_AUTH,
  TREZOR_PIN_ENTERED,
  TREZOR_ACTIVATED,
  OFFLINE,
}
export interface User {
  status: UserStatus;
  device: TrezorDevice | null;
  dropboxAccountName: string;
  dbc: Dropbox | null;
}

// ACTIONS
export interface DropboxUserLoggedIn {
  type: 'DROPBOX_USER_LOGGED_IN';
  userName: string;
  dbc: Dropbox;
}
export interface LogoutUser {
  type: 'LOGOUT';
}
export interface AddDevice {
  type: 'ADD_DEVICE';
  device: TrezorDevice;
}
export interface RemoveDevice {
  type: 'REMOVE_DEVICE';
}
export interface ShowPinDialog {
  type: 'SHOW_PIN_DIALOG';
}
export interface DevicePinEntered {
  type: 'DEVICE_PIN_ENTERED';
}
export interface ActivatedTmpOnDevice {
  type: 'ACTIVATED_TMP_ON_DEVICE';
  keyPair: KeyPair;
}

export type UserAction =
  | DropboxUserLoggedIn
  | LogoutUser
  | AddDevice
  | RemoveDevice
  | ShowPinDialog
  | ActivatedTmpOnDevice
  | DevicePinEntered;

export function userReducer(state: User, action: UserAction): User {
  switch (action.type) {
    case 'DROPBOX_USER_LOGGED_IN': {
      if (state.device !== null) {
        return {
          ...state,
          status: UserStatus.ONLINE_WITH_TREZOR,
          dropboxAccountName: action.userName,
          dbc: action.dbc,
        };
      } else {
        return {
          ...state,
          status: UserStatus.ONLINE_NO_TREZOR,
          dropboxAccountName: action.userName,
          dbc: action.dbc,
        };
      }
    }
    case 'ADD_DEVICE': {
      if (state.status === UserStatus.ONLINE_NO_TREZOR) {
        return {
          ...state,
          status: UserStatus.ONLINE_WITH_TREZOR,
          device: action.device,
        };
      } else {
        return { ...state, device: action.device };
      }
    }
    case 'REMOVE_DEVICE': {
      if (state.status === UserStatus.ONLINE_WITH_TREZOR) {
        return { ...state, status: UserStatus.ONLINE_NO_TREZOR, device: null };
      } else {
        return { ...state, device: null };
      }
    }
    case 'SHOW_PIN_DIALOG': {
      return { ...state, status: UserStatus.TREZOR_REQ_PIN_AUTH };
    }
    case 'DEVICE_PIN_ENTERED': {
      return { ...state, status: UserStatus.TREZOR_PIN_ENTERED };
    }
    case 'ACTIVATED_TMP_ON_DEVICE': {
      if (state.device !== null) {
        const device: TrezorDevice = {
          ...state.device,
          masterKey: action.keyPair.masterKey,
          encryptionKey: action.keyPair.encryptionKey,
        };
        return {
          ...state,
          device: device,
          status: UserStatus.TREZOR_ACTIVATED,
        };
      } else {
        return { ...state, status: UserStatus.ONLINE_NO_TREZOR, device: null };
      }
    }
    case 'LOGOUT': {
      return {
        ...state,
        status: UserStatus.OFFLINE,
        dropboxAccountName: '',
        dbc: null,
      };
    }
  }
}
