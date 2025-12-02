/// <reference types="cypress" />

import { Inter } from 'next/font/google';
import { IMAGE_FILE } from 'lib/images';
import React from 'react';
import ClosedEntry from './PasswordEntry/ClosedEntry';
import { withLoggedInUser, withSafePasswordEntry, withStubDeps, withTrezorService } from 'test-utils/mocks';
import { UserProvider } from 'contexts/user.context';
import { TagEntriesProvider } from 'contexts/tag-entries.context';
import { Dependencies, DependenciesContext } from 'contexts/deps.context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

interface PasswordTableProps {
  deps: Dependencies;
  children: React.ReactNode;
}

function PasswordTableWrapper({ deps, children }: PasswordTableProps) {
  const user = withLoggedInUser();
  return (
    <div className={inter.className}
         style={{
           margin: 0,
           display: 'block',
           minHeight: '100vh',
           minWidth: '100vw',
           backgroundColor: 'lightgray',
         }}
    >
      <DependenciesContext.Provider value={deps}>
        <UserProvider initialUser={user}>
          <TagEntriesProvider>{children}</TagEntriesProvider>
        </UserProvider>
      </DependenciesContext.Provider>
    </div>
  );
}

const width = 1500;
const height = 500;

describe('Closed entry in locked state', () => {
  beforeEach(() => {
    cy.viewport(width, height);
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

  it('shows pointer on username', () => {
    const safeEnty = withSafePasswordEntry(2, false);
    const voidFn = () => {};
    const deps = withStubDeps();
    cy.mount(
      <PasswordTableWrapper deps={deps}>
        <ClosedEntry safeEntry={safeEnty} onOpenEntry={voidFn} locked={false} onLockChange={voidFn} />
      </PasswordTableWrapper>
    );
    cy.get(`[data-cy=closed-entry-username-${safeEnty.key}]`)
      .should(($el) => {
        const cursor = getComputedStyle($el[0]).cursor;
        expect(cursor).to.equal('pointer');
      });
  });

  it('edit button is shown and clickable when the closed entry is hovered', () => {
    const safeEnty = withSafePasswordEntry(3, false);

    // Cypress cannot test hover so need to set defaultIsHovered to true
    const voidFn = () => {};
    const deps = withStubDeps();
    cy.mount(
      <PasswordTableWrapper deps={deps}>
        <ClosedEntry safeEntry={safeEnty} onOpenEntry={voidFn} locked={false} onLockChange={voidFn} defaultIsHovered={true} />
      </PasswordTableWrapper>
    );

    cy.get(`[data-cy=closed-entry-edit-button-${safeEnty.title}]`)
      .should('be.visible')
      .should(($el) => {
        const cursor = getComputedStyle($el[0]).cursor;
        expect(cursor).to.equal('pointer');
      })
      .click(); // Verify it's clickable
  });

  it('username, password shadow, and edit button are horizontally aligned when hovered', () => {
    const safeEnty = withSafePasswordEntry(5, false);

    // Cypress cannot test hover so need to set defaultIsHovered to true
    const voidFn = () => {};
    const deps = withStubDeps();
    cy.mount(
      <PasswordTableWrapper deps={deps}>
        <ClosedEntry safeEntry={safeEnty} onOpenEntry={voidFn} locked={false} onLockChange={voidFn} defaultIsHovered={true} />
      </PasswordTableWrapper>
    );

    // Check that username and password shadow are vertically aligned
    cy.shouldAlignMiddleY(
      `[data-cy=closed-entry-username-${safeEnty.key}]`,
      `[data-cy=closed-entry-password-copy-${safeEnty.key}]`,
      2,
      true
    )

    // Check that username and edit button are vertically aligned
    cy.shouldAlignMiddleY(
      `[data-cy=closed-entry-username-${safeEnty.key}]`,
      `[data-cy=closed-entry-edit-button-${safeEnty.title}]`,
      2,
      true
    )

    // Check that password shadow and edit button are vertically aligned
    cy.shouldAlignMiddleY(
      `[data-cy=closed-entry-password-copy-${safeEnty.key}]`,
      `[data-cy=closed-entry-edit-button-${safeEnty.title}]`,
      2,
      true
    )
  });
});


describe('Closed entry being unlocked', () => {
  beforeEach(() => {
    cy.viewport(width, height);
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
  it('copy password is pressed', () => {
    const safeEnty = withSafePasswordEntry(4, false);
    const neverResolvingPromise = new Promise(() => {});
    const trezorService = {
      decryptFullEntry: cy.stub().returns(neverResolvingPromise),
    };
    const deps = withTrezorService(trezorService)
    // Cypress cannot test hover so need to set defaultIsHovered to true
    const voidFn = () => {};
    cy.mount(
      <PasswordTableWrapper deps={deps}>
        <ClosedEntry safeEntry={safeEnty} onOpenEntry={voidFn} locked={false} onLockChange={voidFn} defaultIsHovered={true} />
      </PasswordTableWrapper>
    ).then(() => {
      //debugger;
    });
    // Now the password copy button should be visible
    cy.get(`[data-cy=closed-entry-password-copy-${safeEnty.key}]`)
      .should('be.visible')
      .click();

    cy.get('[data-cy=closed-entry-details]').should('have.text', 'Copying password to clipboard');

    cy.shouldAlignLeft(
      `[data-cy=closed-entry-title-${safeEnty.title}]`,
      `[data-cy=closed-entry-details]`,
      2,
      true
    );
  });
});