import { describe, expect } from '@jest/globals';
import {
  ActivatedTmpOnDevice,
  AddDevice,
  DropboxUserLoggedIn,
  User,
  UserAction,
  userReducer,
  UserStatus,
} from './user.reducer';
import { Dropbox } from 'dropbox';
import { TrezorDevice } from 'lib/trezor';

jest.mock('dropbox');

const defaultInitialUser = {
  status: UserStatus.OFFLINE,
  device: null,
  dropboxAccountName: '',
  dbc: null,
  errorMsg: '',
};

function buildState(actions: UserAction[]): User {
  return actions.reduce(userReducer, defaultInitialUser);
}
export function withDevice(label: string): TrezorDevice {
  const defaultDevice: TrezorDevice = {
    label: 'default',
    model: '1',
    deviceId: '1234',
    pathId: 'path',
    appDataSeed: 'seed',
    appDataEncryptionKey: new Uint8Array(),
  };
  return {
    ...defaultDevice,
    label,
  };
}

describe('useReducer', () => {
  describe('when user is offline', () => {
    const mockDropbox = new Dropbox();
    const initialState = buildState([]);

    it('should transition to TREZOR_ACTIVATED after all activation events (happy path)', () => {
      const dropBoxUserLoggedIn: DropboxUserLoggedIn = {
        type: 'DROPBOX_USER_LOGGED_IN',
        userName: 'test',
        dbc: mockDropbox,
      };
      let actualState = userReducer(initialState, dropBoxUserLoggedIn);
      expect(actualState.status).toEqual(UserStatus.ONLINE_NO_TREZOR);

      const mDevice: TrezorDevice = {
        label: 'test',
        model: 'test',
        deviceId: 'test',
        pathId: 'test',
        appDataSeed: '',
        appDataEncryptionKey: new Uint8Array(),
      };

      const addDevice: AddDevice = {
        type: 'ADD_DEVICE',
        device: mDevice,
      };

      actualState = userReducer(actualState, addDevice);
      expect(actualState.status).toEqual(UserStatus.ONLINE_WITH_TREZOR);

      // the index page will navigate to the dashboard page after the keypair is initialized
      const activateDevice: ActivatedTmpOnDevice = {
        type: 'ACTIVATED_TMP_ON_DEVICE',
        keyPair: {
          userAppDataSeed512Bit: 'test',
          userAppDataEncryptionKey: new Uint8Array(),
        },
      };

      // initial state for userContext so that the dashboard component is loaded
      const expectedState: User = {
        status: UserStatus.TREZOR_ACTIVATED,
        device: {
          label: 'test',
          model: 'test',
          deviceId: 'test',
          pathId: 'test',
          appDataSeed: 'test',
          appDataEncryptionKey: new Uint8Array(),
        },
        dropboxAccountName: 'test',
        dbc: new Dropbox(),
      };
      actualState = userReducer(actualState, activateDevice);

      expect(actualState.status).toEqual(expectedState.status);
      expect(actualState.device).toEqual(expectedState.device);
      expect(actualState.dropboxAccountName).toEqual(expectedState.dropboxAccountName);
      expect(actualState.dbc).toBeDefined();
    });

    it('should transition to ONLINE_WITH_TREZOR on device event and dropbox login', () => {
      const actions: UserAction[] = [
        { type: 'ADD_DEVICE', device: withDevice('Unacquired device') },
        { type: 'DROPBOX_USER_LOGGED_IN', userName: 'test', dbc: mockDropbox },
      ];

      const actual = actions.reduce(userReducer, initialState);

      expect(actual.status).toEqual(UserStatus.ONLINE_WITH_TREZOR);
    });
  });
  describe('when user is connected to storage account', () => {
    const mockDropbox = new Dropbox();
    const initialState = buildState([{ type: 'DROPBOX_USER_LOGGED_IN', userName: 'test', dbc: mockDropbox }]);

    it('should transition to ONLINE_WITH_TREZOR on device event', () => {
      const addDevice: AddDevice = { type: 'ADD_DEVICE', device: withDevice('tmp1') };

      const actual = userReducer(initialState, addDevice);

      expect(actual.status).toEqual(UserStatus.ONLINE_WITH_TREZOR);
    });
  });
});
