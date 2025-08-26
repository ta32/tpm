/// <reference types="cypress" />
import { Inter } from 'next/font/google';
import React from 'react';
import Home from './Home';
import { User, UserProvider } from 'contexts/user.context';
import { IMAGE_FILE } from 'lib/images';
import { Dropbox, DropboxAuth } from 'dropbox';
import { Dependencies, DependenciesContext } from 'contexts/deps.context';
import { withDropboxService, withServices, withStubDeps, withTrezorService } from 'lib/mocks';
import { DropboxService } from 'lib/dropbox';
import { TrezorService } from 'lib/trezor';
import { TransportEventMessage } from '@trezor/connect-web';

const inter = Inter({ subsets: ['latin'] });

/// region Types
interface HomePageWrapperProps {
  initialUser?: User;
  children: React.ReactNode;
  deps: Dependencies;
}
type TransportEventHandler = (event: TransportEventMessage) => void;
interface TrezorServiceWithTransportEventsTrigger {
  trezorService: Partial<TrezorService>;
  trigger: TransportEventTrigger;
}

interface TransportEventTrigger {
  callback: TransportEventHandler;
  isReady: boolean;
  waitForReady: () => Promise<void>;
}
/// endregion

/// region Helper
function withMockedTransportEvents(): TrezorServiceWithTransportEventsTrigger {
  const trigger: TransportEventTrigger = {
    callback: () => {},
    isReady: false,
    async waitForReady() {
      while (!trigger.isReady) {
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
      }
    },
  };
  const trezorService: Partial<TrezorService> = {
    setTrezorTransportEventHandler: cy.stub().callsFake((userProvidedCallback: TransportEventHandler) => {
      trigger.isReady = true;
      trigger.callback = userProvidedCallback;
    }),
  };
  return {
    trezorService,
    trigger,
  };
}
/// endregion

function HomePageWrapper({ deps, initialUser, children }: HomePageWrapperProps) {
  return (
    <div className={inter.className} style={{ margin: 0 }}>
      <DependenciesContext.Provider value={deps}>
        <UserProvider initialUser={initialUser}>{children}</UserProvider>
      </DependenciesContext.Provider>
    </div>
  );
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
    cy.viewport(1920, 1080);
    const voidFunc = () => {};
    let dropboxSignInClicked = false;
    const handleDropBoxSignIn = () => {
      dropboxSignInClicked = true;
    };
    const customDeps = withStubDeps();
    cy.mount(
      <HomePageWrapper deps={customDeps}>
        <Home
          dropboxArgs={{ urlSearch: '', codeVerifier: null }}
          handleLogout={voidFunc}
          handleDropBoxSignIn={handleDropBoxSignIn}
        />
      </HomePageWrapper>
    );
    cy.get('[data-cy=storage-login]')
      .click()
      .then(() => {
        expect(dropboxSignInClicked).to.be.true;
      });
  });

  it('after OAUTH redirect while connecting to storage account, the user sees the spinner', () => {
    cy.viewport(1920, 1080);
    const voidFunc = () => {};
    const neverResolvingPromise = new Promise(() => {});
    const dropboxService: Partial<DropboxService> = {
      connectDropbox: cy.stub().returns(neverResolvingPromise),
    };
    const customDeps = withDropboxService(dropboxService);

    cy.mount(
      <HomePageWrapper deps={customDeps}>
        <Home
          dropboxArgs={{
            urlSearch: '?code=REDIRECT_CODE_AFTER_OAUTH_FROM_DROPBOX_IS_ACCEPTED',
            codeVerifier: 'some_value',
          }}
          handleLogout={voidFunc}
          handleDropBoxSignIn={voidFunc}
        />
      </HomePageWrapper>
    );
    // should appear after the OAUTH redirect
    cy.get('[data-cy=storage-login]').should('exist');
    // page realizes that it loaded after the OAUTH redirect
    cy.get('[data-cy=home-page-spinner]').should('exist');
  });

  it('after OAUTH redirect and sign in to the storage account, the dropbox user is shown', () => {
    cy.viewport(1920, 1080);
    const voidFunc = () => {};
    // dummy dropbox instance
    const dbc = new Dropbox({ auth: new DropboxAuth({ clientId: '123' }) });
    // once dropbox is connected, the user should see the account name
    const dropboxService: Partial<DropboxService> = {
      connectDropbox: cy.stub().resolves({ dbc: dbc, name: 'ta32mock' }),
    };
    const customDeps = withDropboxService(dropboxService);
    // act
    cy.mount(
      <HomePageWrapper deps={customDeps}>
        <Home
          dropboxArgs={{
            urlSearch: '?code=REDIRECT_CODE_AFTER_OAUTH_FROM_DROPBOX_IS_ACCEPTED',
            codeVerifier: 'some_value',
          }}
          handleLogout={voidFunc}
          handleDropBoxSignIn={voidFunc}
        />
      </HomePageWrapper>
    );
    // should appear after the OAUTH redirect
    cy.get('[data-cy=storage-login]').should('exist');
    // assert
    cy.get('[data-cy=dropbox-account-name]').should('have.text', 'ta32mock');
  });

  it('trezor bridge loses connection after connecting to dropbox, user should still be connected to dropbox', () => {
    cy.viewport(1920, 1080);
    const voidFunc = () => {};
    const bridgeDownMessage: TransportEventMessage = {
      event: 'TRANSPORT_EVENT',
      type: 'transport-error',
      payload: {
        error: 'Bridge is down',
        code: 'BRIDGE_DOWN',
        apiType: 'usb',
      },
    };
    const bridgeAvailableMessage: TransportEventMessage = {
      event: 'TRANSPORT_EVENT',
      type: 'transport-start',
      payload: {
        type: 'BridgeTransport',
        apiType: 'usb',
        version: '2.0.0',
        outdated: false,
      },
    };

    const dbc = new Dropbox({ auth: new DropboxAuth({ clientId: '123' }) });
    const dropboxService: Partial<DropboxService> = {
      connectDropbox: cy.stub().resolves({ dbc: dbc, name: 'ta32mock' }),
    };
    const { trezorService, trigger }: TrezorServiceWithTransportEventsTrigger = withMockedTransportEvents();
    const customDeps = withServices(trezorService, dropboxService);

    cy.mount(
      <HomePageWrapper deps={customDeps}>
        <Home
          dropboxArgs={{
            // simulate the OAUTH redirect after the user accepted the Dropbox OAUTH
            urlSearch: '?code=REDIRECT_CODE_AFTER_OAUTH_FROM_DROPBOX_IS_ACCEPTED',
            codeVerifier: 'some_value',
          }}
          handleLogout={voidFunc}
          handleDropBoxSignIn={voidFunc}
        />
      </HomePageWrapper>
    ).then(() => {
      //debugger;
    });

    // should appear after the OAUTH redirect
    cy.get('[data-cy=storage-login]').should('exist');
    // assert
    cy.get('[data-cy=dropbox-account-name]')
      .should('have.text', 'ta32mock')
      .then(() => {
        // simulate Trezor bridge being down
        trigger.callback(bridgeDownMessage);
      });
    cy.get('[data-cy=bridge-modal]')
      .should('be.visible')
      .then(() => {
        // simulate Trezor bridge being available
        trigger.callback(bridgeAvailableMessage);
      });
    cy.get('[data-cy=bridge-modal]').should('not.be.visible');
    cy.get('[data-cy=dropbox-account-name]').should('have.text', 'ta32mock');
  });

  it('after trezor bridge loses connection, before connecting to dropbox, user should see connect to dropbox button', () => {
    cy.viewport(1920, 1080);
    const voidFunc = () => {};
    const bridgeDownMessage: TransportEventMessage = {
      event: 'TRANSPORT_EVENT',
      type: 'transport-error',
      payload: {
        error: 'Bridge is down',
        code: 'BRIDGE_DOWN',
        apiType: 'usb',
      },
    };
    const bridgeAvailableMessage: TransportEventMessage = {
      event: 'TRANSPORT_EVENT',
      type: 'transport-start',
      payload: {
        type: 'BridgeTransport',
        apiType: 'usb',
        version: '2.0.0',
        outdated: false,
      },
    };

    const { trezorService, trigger }: TrezorServiceWithTransportEventsTrigger = withMockedTransportEvents();
    const customDeps = withTrezorService(trezorService);

    cy.mount(
      <HomePageWrapper deps={customDeps}>
        <Home
          dropboxArgs={{
            urlSearch: '',
            codeVerifier: null,
          }}
          handleLogout={voidFunc}
          handleDropBoxSignIn={voidFunc}
        />
      </HomePageWrapper>
    ).then(() => {
      // debugger;
    });

    // should appear after the OAUTH redirect
    cy.get('[data-cy=storage-login]')
      .should('be.visible')
      .then(() => trigger.waitForReady())
      .then(() => trigger.callback(bridgeDownMessage));

    cy.get('[data-cy=bridge-modal]')
      .should('be.visible')
      .then(() => trigger.callback(bridgeAvailableMessage));

    cy.get('[data-cy=bridge-modal]').should('not.be.visible');
    cy.get('[data-cy=storage-login]').should('be.visible');
  });
});
