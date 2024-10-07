/// <reference types="cypress" />
import { Inter } from "next/font/google";
import React from 'react';
import Home from './Home'
import { UserProvider } from 'contexts/use-user';
import { IMAGE_FILE } from 'lib/images';
import { Dropbox } from 'dropbox';
import { UserStatus } from '../../contexts/reducers/user-reducer';

const inter = Inter({ subsets: ['latin'] });

describe('<Home />', () => {
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

  it('before OAUTH sign into storage account user can see the sign in button', () => {
    cy.viewport(1920,1080);
    const voidFunc = () => {};
    let dropboxSignInClicked = false;
    const handleDropBoxSignIn = () => {
      dropboxSignInClicked = true;
    };
    cy.mount(
      <div className={inter.className} style={{margin: 0}}>
        <UserProvider>
          <Home loading={false} openDevice={voidFunc} enterPin={voidFunc} handleLogout={voidFunc} handleDropBoxSignIn={handleDropBoxSignIn}/>
        </UserProvider>
      </div>
    )
    cy.get('[data-cy=storage-login]').click().then(() => {
      expect(dropboxSignInClicked).to.be.true;
    });
  })

  it('after OAUTH redirect and sign in the dropbox user is shown', () => {
    const userAfterSignIn = {
      status: UserStatus.ONLINE_NO_TREZOR,
      device: null,
      dropboxAccountName: 'ta32mock',
      dbc: new Dropbox(),
      errorMsg: '',
    }
    cy.viewport(1920,1080);
    const voidFunc = () => {};
    cy.mount(
      <div className={inter.className} style={{margin: 0}}>
        <UserProvider initialUser={userAfterSignIn}>
          <Home loading={false} openDevice={voidFunc} enterPin={voidFunc} handleLogout={voidFunc} handleDropBoxSignIn={voidFunc}/>
        </UserProvider>
      </div>
    )
  });
})
