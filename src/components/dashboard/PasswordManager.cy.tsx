/// <reference types="cypress" />

import { Inter } from 'next/font/google';
import React from 'react';
import { User } from 'contexts/reducers/user.reducer';
import { UserProvider } from 'contexts/user.context';
import { IMAGE_FILE, TAG_ALL, TAG_BITCOIN, TAG_SOCIAL } from 'lib/images';
import PasswordManager from './PasswordManager';
import { TagEntriesProvider } from 'contexts/tag-entries.context';
import { PasswordEntriesProvider } from 'contexts/password-entries.context';
import { LocationProvider } from 'contexts/location.context';
import { Dependencies, DependenciesContext } from 'contexts/deps.context';
import { AppData, TrezorAppData } from 'lib/storage';
import { ClearPasswordEntry, SafePasswordEntry } from 'lib/trezor';
import { TagEntries, TagEntry, TagsStatus } from 'contexts/reducers/tag-entries.reducer';
import { withLoggedInUser, withServices, withTrezorPasswordEntry, withTrezorService } from 'lib/mocks';

const inter = Inter({ subsets: ['latin'] });

// region Types
interface DashboardPageProps {
  deps: Dependencies;
  children: React.ReactNode;
  initialUser?: User;
  initialTags?: TagEntries;
}
// endregion

// region Helpers
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

function withInitialTagEntries(): TagEntries {
  return {
    status: TagsStatus.UNINITIALIZED,
    lastError: '',
    entries: {
      "0": {
        id: "0",
        title: 'ALL',
        icon: TAG_ALL,
      }, // ALL tag must match the real tag id or behaviour will change
      "1": {
        id: "1",
        title: 'Social',
        icon: TAG_SOCIAL,
      },
      "2": {
        id: "2",
        title: 'Bitcoin',
        icon: TAG_BITCOIN,
      },
    },
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

function DashboardPageWrapper({deps, initialUser, initialTags, children}: DashboardPageProps) {
  return (
    <div className={inter.className} style={{margin: 0}}>
      <DependenciesContext.Provider value={deps}>
        <LocationProvider>
          <UserProvider initialUser={initialUser}>
            <TagEntriesProvider initialTagEntries={initialTags}>
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
// endregion

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
    const user = withLoggedInUser();

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
      const user = withLoggedInUser();
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
    const user = withLoggedInUser();
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
    cy.get('[data-cy=closed-entry-key1]').should('exist');
    cy.get('[data-cy=closed-entry-key2]').should('exist');
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

  it('imports old trezor passwords with new tags and entries', () => {
    const user = withLoggedInUser();
    const tagEntries = withInitialTagEntries();
    // default AppData
    let appData: AppData = {
      entries: [],
      version: 1,
      tags: Object.values(withInitialTagEntries().entries),
      modelVersion: 1
    }
    const importedAppData: TrezorAppData = {
      version: "0",
      extVersion: "0",
      config: {
        orderType: "0",
      },
      tags: {
        "trezor_original_all_tag": {
          title: "All",
          icon: "home"
        },
        "trezor_original_social": {
          title: "Social",
          icon: "person-stalker"
        },
        "trezor_original_bitcoin": {
            title: "Bitcoin",
            icon: "social-bitcoin"
        },
        "3b": {
          title: "Tag1",
          icon: "person" // --> should be "account_circle"
        },
      },
      entries: {
        "0": withTrezorPasswordEntry("item2", ['3b']),
        "1": withTrezorPasswordEntry("item1", ['trezor_original_all_tag']),
      }
    }
    const trezorService = {
      decryptAppData: cy.stub().resolves(appData),
      decryptTrezorAppData: cy.stub().resolves(importedAppData),
      encryptAppData: cy.stub().callsFake((newAppData: AppData, encryptionKey: Uint8Array) => {
        Object.assign(appData, newAppData);
        return Promise.resolve(new Uint8Array(32));
      }),
    }
    const customDeps = withTrezorService(trezorService);
    cy.viewport(1920,1080);
    cy.mount(
      <DashboardPageWrapper initialUser={user} deps={customDeps} initialTags={tagEntries}>
        <PasswordManager />
      </DashboardPageWrapper>
    ).then(() => {
      debugger;
    })
    cy.get('[data-cy=password-table-account-name]').should('exist').click();
    cy.get('[data-cy=password-table-import-passwords]').click();

    cy.get('[data-cy=import-passwords-dropzone]').should('exist')
      .selectFile({
        contents: Cypress.Buffer.from('file contents'),
        fileName: 'file.pswd',
        mimeType: 'application/octet-stream',
        lastModified: Date.now(),
      }, {
      action: 'drag-drop'
    })

    cy.get('[data-cy=import-passwords-load-passwords]').click()
    cy.get('[data-cy=import-passwords-save]').click();

    cy.get('[data-cy=closed-entry-title-item2]').should('exist');

    // apply tag filter for item2 (tag1)
    cy.get('[data-cy=tag-Tag1]').click();
    cy.get('[data-cy=closed-entry-title-item2]').should('exist');
  });
});
