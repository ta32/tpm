/// <reference types="cypress" />

import { Inter } from 'next/font/google';
import React from 'react';
import { User, UserAction } from 'contexts/reducers/user.reducer';
import { UserProvider } from 'contexts/user.context';
import { IMAGE_FILE } from 'lib/images';
import PasswordManager from './PasswordManager';
import { TagEntriesProvider } from 'contexts/tag-entries.context';
import { PasswordEntriesProvider } from 'contexts/password-entries.context';
import { LocationProvider } from 'contexts/location.context';
import { Dependencies, DependenciesContext } from 'contexts/deps.context';
import { AppData } from 'lib/storage';
import { ClearPasswordEntry, SafePasswordEntry } from 'lib/trezor';
import { TagEntry } from 'contexts/reducers/tag-entries.reducer';
import { LOGGED_IN_USER, withServices, withTrezorService } from 'lib/mocks';
const inter = Inter({ subsets: ['latin'] });


interface DashboardPageProps {
  deps: Dependencies;
  children: React.ReactNode;
  initialUser?: User;
  onStorageLogin?: () => UserAction;
}

function withSafePasswordEntry(num: number, legacy: boolean): SafePasswordEntry {
  return {
    key: `key${num}`,
    item: `item${num}`,
    title: `Title${num}`,
    username: `username${num}`,
    passwordEnc: new Uint8Array([num]),
    secretNoteEnc: new Uint8Array([num]),
    safeKey: `safeKey${num}`,
    tags: [`tag${num}`],
    createdDate: 0,
    lastModifiedDate: 0,
    legacyMode: legacy,
  };
}

function withClearPasswordEntry(entry: SafePasswordEntry): ClearPasswordEntry {
  return {
    key: entry.key,
    item: entry.item,
    title: entry.title,
    username: entry.username,
    password: 'password-' + entry.key,
    safeNote: 'safeNote-' + entry.key,
    tags: entry.tags,
    createdDate: entry.createdDate,
    lastModifiedDate: entry.lastModifiedDate,
  };
}

function withTagEntry(num: number): TagEntry {
  return {
    id: `id${num}`,
    title: `title${num}`,
    icon: `bitcoin`,
  };
}


function DashboardPageWrapper({deps, initialUser, children}: DashboardPageProps) {
  return (
    <div className={inter.className} style={{margin: 0}}>
      <DependenciesContext.Provider value={deps}>
        <LocationProvider>
          <UserProvider initialUser={initialUser}>
            <TagEntriesProvider>
              <PasswordEntriesProvider>
                {children}
              </PasswordEntriesProvider>
            </TagEntriesProvider>
          </UserProvider>
        </LocationProvider>
      </DependenciesContext.Provider>
    </div>
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

  it('password manager password can filter password entries', () => {
    const user = LOGGED_IN_USER;

    const appData: AppData = {
      entries: [
        withSafePasswordEntry(1, false),
        withSafePasswordEntry(2, false),
        withSafePasswordEntry(3, false),
      ],
      version: 1,
      tags: [withTagEntry(1)],
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
      // debugger;
    });
    cy.get('[data-cy=filter-input]').type('TitLe1');
    cy.get('[data-cy=closed-entry-key1]').should('exist');
    cy.get('[data-cy=closed-entry-key2]').should('not.exist');
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

  it('able to copy password from password manager', () => {
    const user = LOGGED_IN_USER;
    const newEntry = withSafePasswordEntry(1, false);
    const legacyEntry = withSafePasswordEntry(2, true);

    const appData: AppData = {
      entries: [
        newEntry,
        legacyEntry,
      ],
      version: 1,
      tags: [],
      modelVersion: 1
    }
    const neverResolvingPromise = new Promise(() => {});

    // using a never resolving promise otherwise test will exit early
    const clearEntry = null;
    const trezorService = {
      decryptAppData: cy.stub().resolves(appData),
      decryptFullEntry: cy.stub().withArgs(newEntry, false).returns(neverResolvingPromise)
                                 .withArgs(legacyEntry, true).returns(neverResolvingPromise),
    }
    const customDeps = withTrezorService(trezorService);

    cy.viewport(1920,1080);
    cy.mount(
      <DashboardPageWrapper initialUser={user} deps={customDeps}>
        <PasswordManager />
      </DashboardPageWrapper>
    ).then(() => {
      // debugger;
    });

    // two closed entries
    cy.get('[data-cy=closed-entry-title-key1]').should('exist');
    cy.get('[data-cy=closed-entry-title-key2]').should('exist');
    cy.wrap(trezorService.decryptAppData).should('be.called');

    // cypress doesn't support hover so we need to click a hidden button
    cy.get('[data-cy=closed-entry-password-copy-key1]').click({force: true});     // https://docs.cypress.io/api/commands/hover
    cy.get('[data-cy=closed-entry-action-msg]').should('contain', 'Copying Password to clipboard');
    cy.wrap(trezorService.decryptFullEntry).should('be.calledWith', newEntry, false);

    // need to remount because the promise is not resolving
    cy.viewport(1920,1080);
    cy.mount(
      <DashboardPageWrapper initialUser={user} deps={customDeps}>
        <PasswordManager />
      </DashboardPageWrapper>
    ).then(() => {
      // debugger;
    });

    // copy legacy password
    cy.get('[data-cy=closed-entry-password-copy-key2]').click({force: true});    // https://docs.cypress.io/api/commands/hover
    cy.get('[data-cy=closed-entry-action-msg]').should('contain', 'Copying Password to clipboard');
    cy.wrap(trezorService.decryptFullEntry).should('be.calledWith', legacyEntry, true);

  });
});
