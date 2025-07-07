import { Dependencies } from 'contexts/deps.context';
import { SafePasswordEntry, TrezorService } from 'lib/trezor';
import { DropboxService } from 'lib/dropbox';
import { User, UserStatus } from 'contexts/reducers/user.reducer';
import { Dropbox, DropboxAuth } from 'dropbox';

// region Object Builders
export function withLoggedInUser(): User {
  return {
    status: UserStatus.ONLINE_WITH_TREZOR,
    dbc: Cypress.sinon.createStubInstance(Dropbox),
    device: {
      label: 'trezor_device_label',
      appDataSeed: 'appDataSeed',
      appDataEncryptionKey: new Uint8Array(32),
      deviceId: 'deviceId',
      model: 't1',
      path: 'path',
    },
    dropboxAccountName: 'test',
  };
}
function withDefaultDeps(): Dependencies {
  return {
    trezor: () => ({
      decryptAppData: cy.stub().resolves(),
      encryptAppData: cy.stub().resolves(new Uint8Array(32)),
      decryptFullEntry: cy.stub().resolves(),
      decryptTrezorAppData: cy.stub().resolves(),
      initTrezor: cy.stub().resolves(),
      encryptFullEntry: cy.stub().resolves(),
      getDevice: cy.stub().resolves([withLoggedInUser().device]),
      getEncryptionKey: cy.stub().resolves(new Uint8Array(32)),
      setTrezorUiEventHandler: cy.stub().resolves(),
      setTrezorDeviceEventHandler: cy.stub().resolves(),
    }),
    dropbox: () => ({
      hasRedirectedFromAuth: cy.stub().returns(true),
      connectDropbox: cy.stub().resolves({ dbc: withLoggedInUser().dbc, name: withLoggedInUser().dropboxAccountName }),
      getAuthUrl: cy.stub().resolves('authUrl'),
      readAppFile: cy.stub().resolves({ data: new Uint8Array(0), rev: 'rev', initialized: true }),
      saveAppFile: cy.stub().resolves({}),
    }),
  };
}
// endregion

// region Dependency Builders
export function withStubDeps(): Dependencies {
  return {
    ...withDefaultDeps(),
  };
}

export function withTrezorService(trezorService: Partial<TrezorService>): Dependencies {
  return {
    ...withDefaultDeps(),
    trezor: () => ({
      ...withDefaultDeps().trezor(),
      ...trezorService,
    }),
  };
}

export function withDropboxService(dropboxService: Partial<DropboxService>): Dependencies {
  return {
    ...withDefaultDeps(),
    dropbox: () => ({
      ...withDefaultDeps().dropbox(),
      ...dropboxService,
    }),
  };
}

export function withServices(
  trezorService: Partial<TrezorService>,
  dropboxService: Partial<DropboxService>
): Dependencies {
  return {
    ...withDefaultDeps(),
    trezor: () => ({
      ...withDefaultDeps().trezor(),
      ...trezorService,
    }),
    dropbox: () => ({
      ...withDefaultDeps().dropbox(),
      ...dropboxService,
    }),
  };
}
// endregion

// region Builders Trezor
export function withTrezorPasswordEntry(title: string, tags: string[]): any {
  return {
    title: title,
    username: 'username',
    password: {
      type: 'Buffer',
      data: [1, 2, 3],
    },
    nonce: 'abc',
    tags: tags,
    safe_note: {
      type: 'Buffer',
      data: [1, 2, 3],
    },
    note: '',
    success: false,
    export: false,
  };
}
// endregion
