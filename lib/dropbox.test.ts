import { Dropbox, DropboxAuth, DropboxResponse, files } from 'dropbox';
import { appFileName } from './appfile';
import { readAppFile } from './dropbox';
import { readBlob } from './utils';

jest.mock('./appfile');
const mAppFileName = jest.mocked(appFileName);

jest.mock('dropbox');
const mDbxAuth = jest.mocked(DropboxAuth);
const mDropbox = jest.mocked(Dropbox);

jest.mock('./utils');
const mReadBlob = jest.mocked(readBlob);

it('app reads password entries file in app folder once device has been connected', async () => {
  const data = new Uint8Array([1, 2, 3]);
  mReadBlob.mockResolvedValue(data);
  const APP_FILE_NAME = 'unique_file_name_per_hw_account.pswd';
  mDropbox.mockImplementation((options): Dropbox => {
    return {
      filesListFolder: async (options: files.ListFolderArg): Promise<files.ListFolderResult> => {
        return {
          result: {
            entries: [
              {
                '.tag': 'file',
                // user has already uploaded some passwords therefore the app file exists
                // under the app folder in dropbox
                name: APP_FILE_NAME,
              },
            ],
          },
        } as any;
      },
      filesDownload: async (options: files.DownloadArg): Promise<DropboxResponse<files.FileMetadata>> => {
        return {
          result: {
            fileBlob: {
              data: data,
            },
            // when using the update mode, when updating an existing file the rev must match the current rev
            // once the file is updated, the rev is updated by dropbox
            rev: 'must_use_this_rev_when_updating_file_rev_1',
            size: 100,
            '.tag': 'file',
          },
        } as any;
      },
    } as any;
  });
  // This module determines the app file name which is unique per hardware wallet account
  mAppFileName.mockResolvedValue(APP_FILE_NAME);

  // sut
  const dropbox = new Dropbox({ auth: new DropboxAuth({ clientId: '123' }) });
  const entries = await readAppFile('', dropbox);

  expect(entries.data).toStrictEqual(data);
  expect(entries.rev).toStrictEqual('must_use_this_rev_when_updating_file_rev_1');
});
