import { createContext } from 'react';
import { DropboxService, dropboxServiceFactory } from 'lib/dropbox';
import { TrezorService, trezorServiceFactory } from '../lib/trezor';

export interface Dependencies {
  dropbox: () => DropboxService;
  trezor: () => TrezorService;
}

export const defaultDeps: Dependencies = {
  dropbox: dropboxServiceFactory,
  trezor: trezorServiceFactory,
};

export const DependenciesContext = createContext<Dependencies>(defaultDeps);
