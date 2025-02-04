/// <reference types="cypress" />

import { Inter } from 'next/font/google';
import React, { CSSProperties } from 'react';
import { User, UserAction, UserStatus } from 'contexts/reducers/user.reducer';
import { UserProvider, useUser, useUserDispatch } from 'contexts/user.context';
import { IMAGE_FILE } from 'lib/images';
import PasswordManager from './PasswordManager';
import { TagEntriesProvider } from 'contexts/tag-entries.context';
import { PasswordEntriesProvider } from 'contexts/password-entries.context';
import { Dropbox, DropboxAuth, DropboxResponse, files } from 'dropbox';
import { LocationProvider } from 'contexts/location.context';
import { Dependencies, DependenciesContext } from '../../contexts/deps.context';
import * as dropbox from 'lib/dropbox';
import { AppData } from '../../lib/storage';
import { SafePasswordEntry, TrezorService } from '../../lib/trezor';
import { TagEntry } from '../../contexts/reducers/tag-entries.reducer';
import { DropboxService } from 'lib/dropbox';
const inter = Inter({ subsets: ['latin'] });


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
      getDevices: cy.stub().resolves([LOGGED_IN_USER.device]),
      getEncryptionKey: cy.stub().resolves(new Uint8Array(32)),
      setTrezorEventHandlers: cy.stub().resolves(),
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

function withTrezorService(trezorService: Partial<TrezorService>): Dependencies {
  return {
    ...DEFAULT_DEPS,
    trezor: () => ({
      ...DEFAULT_DEPS.trezor(),
      ...trezorService,
    }),
  }
}

function withServices(trezorService: Partial<TrezorService>, dropboxService: Partial<DropboxService>): Dependencies {
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

interface DashboardPageProps {
  deps: Dependencies;
  children: React.ReactNode;
  initialUser?: User;
  onStorageLogin?: () => UserAction;
}

function entry(num: number): SafePasswordEntry {
  return {
    key: `key${num}`,
    item: `item${num}`,
    title: `title${num}`,
    username: `username${num}`,
    passwordEnc: new Uint8Array([num]),
    secretNoteEnc: new Uint8Array([num]),
    safeKey: `safeKey${num}`,
    tags: [`tag${num}`],
    createdDate: 0,
    lastModifiedDate: 0,
  };
}

function tageEntry(num: number): TagEntry {
  return {
    id: `id${num}`,
    title: `title${num}`,
    icon: `bitcoin`,
  };
}

function DashboardPageWrapper(props: DashboardPageProps) {
  return (
    <div className={inter.className} style={{margin: 0}}>
      <DependenciesContext.Provider value={props.deps}>
        <LocationProvider>
          <UserProvider initialUser={props.initialUser}>
            <TagEntriesProvider>
              <PasswordEntriesProvider>
                <DashboardPageController {...props}>
                  {props.children}
                </DashboardPageController>
              </PasswordEntriesProvider>
            </TagEntriesProvider>
          </UserProvider>
        </LocationProvider>
      </DependenciesContext.Provider>
    </div>
  )
}
function DashboardPageController({children, initialUser, onStorageLogin}: DashboardPageProps) {
  const [user, userRef] = useUser();
  const [userDispatch, userDispatchRef] = useUserDispatch();
  const styleHide: CSSProperties = {visibility: 'hidden'};
  return (
    <>
      {children}
      <button style={styleHide} data-cy="invoke-user-dispatch-onStorageLogin" onClick={() => {
        if (onStorageLogin) {
          userDispatch(onStorageLogin());
        } else
          console.error('onStorageLogin is not defined');
      }}
      />
    </>
  )
}

describe('Password Manager Page Tests', () => {
  beforeEach(() => {
    IMAGE_FILE.getPaths().forEach((image) => {
      cy.readFile(`Public${image}`, null).then((img) => {
        // Intercept requests to Next.js backend image endpoint
        cy.intercept('_next/image*', {
          statusCode: 200,
          headers: { 'Content-Type': 'image/png' },
          body: img.buffer,
        });
      });
    });
  });

  it('password manager password displays closed passwords', () => {
    const user = LOGGED_IN_USER;

    const appData: AppData = {
      entries: [
        entry(1),
        entry(2),
        entry(3),
      ],
      version: 1,
      tags: [tageEntry(1)],
      modelVersion: 1
    }
    const trezorService = {
      decryptAppData: cy.stub().resolves(appData)
    }
    const customDeps = withTrezorService(trezorService);
    cy.viewport(1920,1080);
    cy.mount(
      <DashboardPageWrapper initialUser={user} deps={customDeps}>
        <PasswordManager />
      </DashboardPageWrapper>
    ).then(() => {
      debugger;
    });
  });

  it('adding new tag to password manager for new account', () => {
      const user = LOGGED_IN_USER;
      // empty app data
      const appData: AppData = {
        entries: [],
        version: 1,
        tags: [],
        modelVersion: 1
      }
    const trezorService = {
      decryptAppData: cy.stub().resolves(appData)
    }
    // {data: new Uint8Array(0), rev: 'rev', initialized: true}
    // trezor password manager has not been used so no dropbox file exists
    const dropboxService = {
        readAppFile: cy.stub().resolves({data: undefined, rev: '', initialized: false}),
    }

    const customDeps = withServices(trezorService, dropboxService);
    cy.viewport(1920,1080);
    cy.mount(
      <DashboardPageWrapper initialUser={user} deps={customDeps}>
        <PasswordManager />
      </DashboardPageWrapper>
    )
    // adding a new tag
    cy.get('[data-cy=side-panel-add-new-tag]').click();
    cy.get('[data-cy=tag-modal-select-icon-right]').click();
    // should not be able to submit - since only icon is selected and tag title is empty
    cy.get('[data-cy=tag-modal-submit-button]').should('be.hidden');
    cy.get('[data-cy=tag-modal-input-title]').type('new tag 123');
    cy.get('[data-cy=tag-modal-submit-button]').click();
    // should have added the new tag
    cy.contains('[data-cy=tag-title-span]', 'new tag 123').should('exist');
  });
});
