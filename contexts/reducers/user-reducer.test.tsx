import { describe } from '@jest/globals';
import { ActivatedTmpOnDevice, AddDevice, DropboxUserLoggedIn, User, userReducer, UserStatus } from './user-reducer';
import { Dropbox } from 'dropbox';
import { TrezorDevice } from '../../lib/trezor';

jest.mock('dropbox');

describe('User state transitions that results in the dashboard component being rendered', () => {
  const initialState: User = {
    status: UserStatus.OFFLINE,
    device: null,
    dropboxAccountName: '',
    dbc: null,
  };

  const mockDropbox = new Dropbox();

  test('User state transitions that results in the dashboard component being rendered', () => {
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
      path: 'test',
      masterKey: '',
      encryptionKey: new Uint8Array(),
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
        masterKey: 'test',
        encryptionKey: new Uint8Array(),
      },
    };

    // initial state for userContext so that the dashboard component is loaded
    const expectedState: User = {
      status: UserStatus.TPM_READY_TO_LOAD,
      device: {
        label: 'test',
        model: 'test',
        deviceId: 'test',
        path: 'test',
        masterKey: 'test',
        encryptionKey: new Uint8Array(),
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
});
