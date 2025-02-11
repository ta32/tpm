/// <reference types="cypress" />
import { Inter } from "next/font/google";
import React, { CSSProperties} from 'react';
import Home from './Home'
import { User, UserProvider, useUser, useUserDispatch } from 'contexts/user.context';
import { IMAGE_FILE } from 'lib/images';
import { Dropbox } from 'dropbox';
import { UserAction } from 'contexts/reducers/user.reducer';

const inter = Inter({ subsets: ['latin'] });

interface HomePageWrapperProps {
  children: React.ReactNode;
  initialUser?: User;
  onStorageLogin?: () => UserAction;
}
function HomePageWrapper(props: HomePageWrapperProps) {
  return (
    <div className={inter.className} style={{margin: 0}}>
      <UserProvider initialUser={props.initialUser}>
        <HomePageController {...props}>
          {props.children}
        </HomePageController>
      </UserProvider>
    </div>
  )
}
function HomePageController({children, initialUser, onStorageLogin}: HomePageWrapperProps) {
  const [user] = useUser();
  const [userDispatch] = useUserDispatch();
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
      <HomePageWrapper>
        <Home initialLoadingStatus={false}  handleLogout={voidFunc} handleDropBoxSignIn={handleDropBoxSignIn}/>
      </HomePageWrapper>
    )
    cy.get('[data-cy=storage-login]').click().then(() => {
      expect(dropboxSignInClicked).to.be.true;
    });
  })

  it('after OAUTH while signing in to the storage account, the user sees the spinner', () => {
    cy.viewport(1920,1080);
    const voidFunc = () => {};
    cy.mount(
      <HomePageWrapper>
        <Home initialLoadingStatus={true} handleLogout={voidFunc} handleDropBoxSignIn={voidFunc}/>
      </HomePageWrapper>
    )
    cy.get('[data-cy=home-page-spinner]').should('exist');
  });

  it('after OAUTH redirect and sign in to the storage account, the dropbox user is shown', () => {
    cy.viewport(1920,1080);
    const voidFunc = () => {};
    const onStorageLogin = () => {
      return { type: 'DROPBOX_USER_LOGGED_IN', userName: 'ta32mock', dbc: new Dropbox() } as UserAction;
    }
    // act
    cy.mount(
      <HomePageWrapper onStorageLogin={onStorageLogin}>
        <Home initialLoadingStatus={true} handleLogout={voidFunc} handleDropBoxSignIn={voidFunc}/>
      </HomePageWrapper>
    )
    cy.get('[data-cy=invoke-user-dispatch-onStorageLogin]').click({ force: true })

    // assert
    cy.get('[data-cy=dropbox-account-name]').should('have.text', 'ta32mock');
  });
})