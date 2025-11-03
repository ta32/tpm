/// <reference types="cypress" />

import { Inter } from 'next/font/google';
import { IMAGE_FILE } from 'lib/images';
import React from 'react';
import ClosedEntry from './PasswordEntry/ClosedEntry';
import { withLoggedInUser, withSafePasswordEntry } from 'test-utils/mocks';
import { DependenciesContext } from '../../../../contexts/deps.context';
import { LocationProvider } from '../../../../contexts/location.context';
import { UserProvider } from '../../../../contexts/user.context';
import { TagEntriesProvider } from '../../../../contexts/tag-entries.context';
import { PasswordEntriesProvider } from '../../../../contexts/password-entries.context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

interface PasswordTableProps {
  children: React.ReactNode;
}

function PasswordTableWrapper({children}: PasswordTableProps) {
  const user = withLoggedInUser();
  return (
    <div className={inter.className} style={{ margin: 0 }}>
      <UserProvider initialUser={user}>
        <TagEntriesProvider>
          {children}
        </TagEntriesProvider>
      </UserProvider>
    </div>
  )
}
describe('Password entry component test for closed entry', () => {
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

  it('renders correctly', () => {
    const safeEnty = withSafePasswordEntry(1, false);
    const voidFn = () => {};

    cy.viewport(2000, 100);
    cy.mount(
      <PasswordTableWrapper>
        <ClosedEntry safeEntry={safeEnty} onOpenEntry={voidFn} locked={true} onLockChange={voidFn} />
      </PasswordTableWrapper>
    ).then(() => {
      // debugger;
    });

    cy.get('div').contains(safeEnty.title);
  });
});