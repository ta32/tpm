import { createContext } from 'react';
import { DropboxMethods, dropboxFactory } from 'lib/dropbox';

interface Dependencies {
  dropbox: () => DropboxMethods;
}

export const defaultDeps: Dependencies = {
  dropbox: dropboxFactory,
}

export const DependenciesContext = createContext<Dependencies>(defaultDeps);