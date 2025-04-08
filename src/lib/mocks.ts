import { Dependencies } from 'contexts/deps.context';
import { TrezorService } from 'lib/trezor';
import { DropboxService } from 'lib/dropbox';
import { User, UserStatus } from 'contexts/reducers/user.reducer';
import { Dropbox, DropboxAuth } from 'dropbox';

const LOGGED_IN_USER: User = {
  status: UserStatus.ONLINE_WITH_TREZOR,
  dbc: new Dropbox({ auth: new DropboxAuth({ clientId: '123' }) }),
  device:{
    label: 'trezor_device_label',
    appDataSeed: 'appDataSeed',
    appDataEncryptionKey: new Uint8Array(32),
    deviceId: 'deviceId',
    model: 't1',
    path: 'path',
  },
  dropboxAccountName: 'test',
}

const DEFAULT_DEPS: Dependencies = {
  trezor: () => {
    return {
      decryptAppData: cy.stub().resolves({data: new Uint8Array(0), rev: 'rev', initialized: true}),
      encryptAppData: cy.stub().resolves({data: new Uint8Array(0), rev: 'rev', initialized: true}),
      decryptFullEntry: cy.stub().resolves({data: new Uint8Array(0), rev: 'rev', initialized: true}),
      decryptTrezorAppData: cy.stub().resolves({data: new Uint8Array(0), rev: 'rev', initialized: true}),
      initTrezor: cy.stub().resolves({data: new Uint8Array(0), rev: 'rev', initialized: true}),
      encryptFullEntry: cy.stub().resolves({data: new Uint8Array(0), rev: 'rev', initialized: true}),
      getDevice: cy.stub().resolves([LOGGED_IN_USER.device]),
      getEncryptionKey: cy.stub().resolves(new Uint8Array(32)),
      setTrezorUiEventHandler: cy.stub().resolves(),
      setTrezorDeviceEventHandler: cy.stub().resolves(),
    }
  },
  dropbox: () => {
    return {
      hasRedirectedFromAuth: cy.stub().returns(true),
      connectDropbox: cy.stub().resolves({dbc: LOGGED_IN_USER.dbc, name: LOGGED_IN_USER.dropboxAccountName}),
      getAuthUrl: cy.stub().resolves('authUrl'),
      readAppFile: cy.stub().resolves({data: new Uint8Array(0), rev: 'rev', initialized: true}),
      saveAppFile: cy.stub().resolves({data: new Uint8Array(0), rev: 'rev', initialized: true}),
    }
  }
}

export function withStubDeps(): Dependencies {
  return {
    ...DEFAULT_DEPS,
  }
}

export function withTrezorService(trezorService: Partial<TrezorService>): Dependencies {
  return {
    ...DEFAULT_DEPS,
    trezor: () => ({
      ...DEFAULT_DEPS.trezor(),
      ...trezorService,
    }),
  }
}

export function withDropboxService(dropboxService: Partial<DropboxService>): Dependencies {
  return {
    ...DEFAULT_DEPS,
    dropbox: () => ({
      ...DEFAULT_DEPS.dropbox(),
      ...dropboxService,
    }),
  }
}

export function withServices(trezorService: Partial<TrezorService>, dropboxService: Partial<DropboxService>): Dependencies {
  return {
    ...DEFAULT_DEPS,
    trezor: () => ({
      ...DEFAULT_DEPS.trezor(),
      ...trezorService,
    }),
    dropbox: () => ({
      ...DEFAULT_DEPS.dropbox(),
      ...dropboxService,
    }),
  }
}
