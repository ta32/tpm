/// <reference types="cypress" />

import { Inter } from 'next/font/google';
import { IMAGE_FILE } from 'lib/images';
import React from 'react';
import ClosedEntry from './PasswordEntry/ClosedEntry';
import { withLoggedInUser, withSafePasswordEntry } from 'test-utils/mocks';
import { UserProvider } from 'contexts/user.context';
import { TagEntriesProvider } from 'contexts/tag-entries.context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

interface PasswordTableProps {
  children: React.ReactNode;
}

function PasswordTableWrapper({ children }: PasswordTableProps) {
  const user = withLoggedInUser();
  return (
    <div className={inter.className} style={{ margin: 0 }}>
      <UserProvider initialUser={user}>
        <TagEntriesProvider>{children}</TagEntriesProvider>
      </UserProvider>
    </div>
  );
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

describe('Password entry username cursor', () => {
  it('shows pointer cursor when hovering username', () => {
    const safeEnty = withSafePasswordEntry(2, false);
    const voidFn = () => {};
    cy.mount(
      <PasswordTableWrapper>
        <ClosedEntry safeEntry={safeEnty} onOpenEntry={voidFn} locked={false} onLockChange={voidFn} />
      </PasswordTableWrapper>
    );
    cy.get(`[data-cy=closed-entry-username-${safeEnty.key}]`)
      .trigger('mouseover')
      .should(($el) => {
        const cursor = getComputedStyle($el[0]).cursor;
        expect(cursor).to.equal('pointer');
      });
  });
});

describe('Password entry edit button cursor', () => {
  it('shows pointer cursor when hovering edit button', () => {
    const safeEnty = withSafePasswordEntry(3, false);
    const voidFn = () => {};
    cy.mount(
      <PasswordTableWrapper>
        <ClosedEntry safeEntry={safeEnty} onOpenEntry={voidFn} locked={false} onLockChange={voidFn} />
      </PasswordTableWrapper>
    );
    // Hover container to reveal edit button
    cy.get(`[data-cy=closed-entry-${safeEnty.key}]`).trigger('mouseover');
    cy.get(`[data-cy=closed-entry-edit-button-${safeEnty.title}]`)
      .should('be.visible')
      .trigger('mouseover')
      .should(($el) => {
        const cursor = getComputedStyle($el[0]).cursor;
        expect(cursor).to.equal('pointer');
      });
  });
});
