/// <reference types="cypress" />

import { Inter } from 'next/font/google';
import React, { CSSProperties } from 'react';
import { User, UserAction } from 'contexts/reducers/user-reducer';
import { UserProvider, useUser, useUserDispatch } from 'contexts/use-user';
import { IMAGE_FILE } from 'lib/images';
import PasswordManager from './PasswordManager';
import { TagEntriesProvider } from 'contexts/use-tag-entries';
import { PasswordEntriesProvider } from 'contexts/use-password-entries';

const inter = Inter({ subsets: ['latin'] });

interface DashboardPageProps {
  children: React.ReactNode;
  initialUser?: User;
  onStorageLogin?: () => UserAction;
}
function DashboardPageWrapper(props: DashboardPageProps) {
  return (
    <div className={inter.className} style={{margin: 0}}>
      <UserProvider initialUser={props.initialUser}>
        <TagEntriesProvider>
          <PasswordEntriesProvider>
            <DashboardPageController {...props}>
              {props.children}
            </DashboardPageController>
          </PasswordEntriesProvider>
        </TagEntriesProvider>
      </UserProvider>
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

  it('renders password manager main page', () => {
    cy.viewport(1920,1080);
    cy.mount(
      <DashboardPageWrapper>
        <PasswordManager />
      </DashboardPageWrapper>
    );
  });
});
