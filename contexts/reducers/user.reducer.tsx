// MODEL
import { TrezorDevice, AppDataKeys } from '../../lib/trezor';
import { Dropbox } from 'dropbox';

export enum UserStatus {
  ONLINE_NO_TREZOR,
  ONLINE_WITH_TREZOR,
  TREZOR_REQ_PIN_AUTH,
  TREZOR_PIN_ENTERED,
  TREZOR_REQ_CONFIRMATION,
  TREZOR_ENTERED_CONFIRMATION,
  TREZOR_UNACQUIRED_DEVICE,
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
  device: TrezorDevice | null;
}
export interface RemoveDevice {
  type: 'REMOVE_DEVICE';
}
export interface ShowPinDialog {
  type: 'SHOW_PIN_DIALOG';
}
export interface AskForConfirmation {
  type: 'ASK_FOR_CONFIRMATION';
}
export interface ConfirmationEntered {
  type: 'CONFIRMATION_ENTERED';
}
export interface DevicePinEntered {
  type: 'DEVICE_PIN_ENTERED';
}
export interface ActivatedTmpOnDevice {
  type: 'ACTIVATED_TMP_ON_DEVICE';
  keyPair: AppDataKeys;
}

export type UserAction =
  | DropboxUserLoggedIn
  | LogoutUser
  | AddDevice
  | RemoveDevice
  | ShowPinDialog
  | AskForConfirmation
  | ConfirmationEntered
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
      if (action.device === null && state.status === UserStatus.ONLINE_NO_TREZOR) {
        return {
          ...state,
          status: UserStatus.TREZOR_UNACQUIRED_DEVICE,
        };
      }
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
      if (state.status === UserStatus.ONLINE_WITH_TREZOR || state.status === UserStatus.TREZOR_UNACQUIRED_DEVICE) {
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
    case 'ASK_FOR_CONFIRMATION': {
      return { ...state, status: UserStatus.TREZOR_REQ_CONFIRMATION };
    }
    case 'CONFIRMATION_ENTERED': {
      return { ...state, status: UserStatus.TREZOR_ENTERED_CONFIRMATION };
    }
    case 'ACTIVATED_TMP_ON_DEVICE': {
      if (state.device !== null) {
        const device: TrezorDevice = {
          ...state.device,
          appDataSeed: action.keyPair.userAppDataSeed512Bit,
          appDataEncryptionKey: action.keyPair.userAppDataEncryptionKey,
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
