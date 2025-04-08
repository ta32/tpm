/// <reference types="cypress" />
import { Inter } from "next/font/google";
import React from 'react';
import Home from './Home'
import { User, UserProvider } from 'contexts/user.context';
import { IMAGE_FILE } from 'lib/images';
import { Dropbox, DropboxAuth } from 'dropbox';
import { Dependencies, DependenciesContext } from 'contexts/deps.context';
import { withDropboxService, withStubDeps } from '../../lib/mocks';
import { DropboxService } from '../../lib/dropbox';

const inter = Inter({ subsets: ['latin'] });

interface HomePageWrapperProps {
  initialUser?: User;
  children: React.ReactNode;
  deps: Dependencies;
}
function HomePageWrapper({deps, initialUser, children}: HomePageWrapperProps) {
  return (
    <div className={inter.className} style={{margin: 0}}>
      <DependenciesContext.Provider value={deps}>
        <UserProvider initialUser={initialUser}>
          {children}
        </UserProvider>
      </DependenciesContext.Provider>
    </div>
  )
}

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
    const customDeps = withStubDeps();
    cy.mount(
      <HomePageWrapper deps={customDeps}>
        <Home dropboxArgs={{urlSearch: "", codeVerifier: null}} handleLogout={voidFunc} handleDropBoxSignIn={handleDropBoxSignIn}/>
      </HomePageWrapper>
    )
    cy.get('[data-cy=storage-login]').click().then(() => {
      expect(dropboxSignInClicked).to.be.true;
    });
  })

  it('after OAUTH redirect while connecting to storage account, the user sees the spinner', () => {
    cy.viewport(1920,1080);
    const voidFunc = () => {};
    const neverResolvingPromise = new Promise(() => {});
    const dropboxService: Partial<DropboxService> = {
      connectDropbox: cy.stub().returns(neverResolvingPromise),
    }
    const customDeps = withDropboxService(dropboxService);

    cy.mount(
      <HomePageWrapper deps={customDeps}>
        <Home dropboxArgs={{urlSearch: "?code=REDIRECT_CODE_AFTER_OAUTH_FROM_DROPBOX_IS_ACCEPTED", codeVerifier:"some_value"}} handleLogout={voidFunc} handleDropBoxSignIn={voidFunc}/>
      </HomePageWrapper>
    )
    // should appear after the OAUTH redirect
    cy.get('[data-cy=storage-login]').should('exist');
    // page realizes that it loaded after the OAUTH redirect
    cy.get('[data-cy=home-page-spinner]').should('exist');
  });

  it('after OAUTH redirect and sign in to the storage account, the dropbox user is shown', () => {
    cy.viewport(1920,1080);
    const voidFunc = () => {};
    // dummy dropbox instance
    const dbc = new Dropbox({ auth: new DropboxAuth({ clientId: '123' }) });
    // once dropbox is connected, the user should see the account name
    const dropboxService: Partial<DropboxService> = {
      connectDropbox: cy.stub().resolves({dbc: dbc, name: "ta32mock"}),
    }
    const customDeps = withDropboxService(dropboxService);
    // act
    cy.mount(
      <HomePageWrapper deps={customDeps}>
        <Home dropboxArgs={{urlSearch: "?code=REDIRECT_CODE_AFTER_OAUTH_FROM_DROPBOX_IS_ACCEPTED", codeVerifier:"some_value"}} handleLogout={voidFunc} handleDropBoxSignIn={voidFunc}/>
      </HomePageWrapper>
    )
    // should appear after the OAUTH redirect
    cy.get('[data-cy=storage-login]').should('exist');
    // assert
    cy.get('[data-cy=dropbox-account-name]').should('have.text', 'ta32mock');
  });
})