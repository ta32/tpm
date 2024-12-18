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
const inter = Inter({ subsets: ['latin'] });

const LOGGED_IN_USER: User = {
  status: UserStatus.ONLINE_WITH_TREZOR,
  dbc: getDbxMock(),
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

function getDbxMock() {

  return new Dropbox({ auth: new DropboxAuth({ clientId: '123' }) });
}

interface DashboardPageProps {
  children: React.ReactNode;
  initialUser?: User;
  onStorageLogin?: () => UserAction;
}
function DashboardPageWrapper(props: DashboardPageProps) {
  return (
    <div className={inter.className} style={{margin: 0}}>
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

  it('password manager password interactions', () => {
    const user = LOGGED_IN_USER;
    cy.viewport(1920,1080);
    cy.mount(
      <DashboardPageWrapper initialUser={user}>
        <PasswordManager />
      </DashboardPageWrapper>
    ).then(() => {
      debugger;
    });

  });
});
