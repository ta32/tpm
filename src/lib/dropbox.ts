import { Dropbox, DropboxAuth, DropboxResponse, files } from 'dropbox';
import { appFileName } from './appfile';
import { readBlob } from './utils';

export interface DropboxService {
  hasRedirectedFromAuth: typeof hasRedirectedFromAuth;
  connectDropbox: typeof connectDropbox;
  getAuthUrl: typeof getAuthUrl;
  readAppFile: typeof readAppFile;
  saveAppFile: typeof saveAppFile;
}
export const dropboxServiceFactory = (): DropboxService => {
  return {
    hasRedirectedFromAuth,
    connectDropbox,
    getAuthUrl,
    readAppFile,
    saveAppFile,
  };
};

export function hasRedirectedFromAuth(locationSearch: string): boolean {
  return locationSearch.includes('code=');
}

interface AppFile {
  data: Uint8Array | undefined;
  rev: string;
  initialized: boolean;
}

interface DropboxConnection {
  dbc: Dropbox;
  name: string;
}

export async function connectDropbox(
  redirectUri: string,
  codeVerifier: string,
  locationSearch: string
): Promise<DropboxConnection> {
  const dbxAuth = new DropboxAuth({ clientId: CLIENT_ID });
  const code = getAuthCodeFromUrl(locationSearch);
  dbxAuth.setCodeVerifier(codeVerifier);
  let response: DropboxResponse<any>;
  try {
    response = await dbxAuth.getAccessTokenFromCode(redirectUri, code);
  } catch (error) {
    throw new Error('Error getting access token from code: ' + error);
  }
  if (response.result.access_token) {
    dbxAuth.setAccessToken(response.result.access_token);
    // console.log("token expires in: ", response.result.expires_in);
    const dbc = new Dropbox({ auth: dbxAuth });
    const account = await dbc.usersGetCurrentAccount();
    return { dbc, name: account.result.name.display_name };
  }
  throw new Error('No access token');
}

export async function getAuthUrl(appUrl: string): Promise<{ authUrl: string; codeVerifier: string }> {
  const dbxAuth = new DropboxAuth({ clientId: CLIENT_ID });
  try {
    const authUrlObj = await dbxAuth.getAuthenticationUrl(
      appUrl,
      undefined,
      'code',
      'offline',
      undefined,
      undefined,
      true
    );
    const codeVerifier = dbxAuth.getCodeVerifier();
    window.sessionStorage.setItem('codeVerifier', codeVerifier);
    const authUrl = authUrlObj.toString();
    return { authUrl, codeVerifier };
  } catch (error) {
    throw new Error('Could not get authentication URL');
  }
}

export async function readAppFile(masterPublicKey: string, dbc: Dropbox): Promise<AppFile> {
  const fileName = await appFileName(masterPublicKey);
  const files = await listFiles(dbc);
  const fileExists = files.includes(fileName);
  if (fileExists) {
    const response = await dbc.filesDownload({ path: '/' + fileName });
    if (response.result) {
      // need to cast as any to access fileBlob property
      // https://www.dropboxforum.com/t5/Dropbox-API-Support-Feedback/Javascript-API-Clarity-filesDownload/td-p/282827
      let metaData: any = response.result;
      if (metaData.fileBlob) {
        const rev = metaData.rev;
        const buffer = await readBlob(metaData.fileBlob);
        return {
          rev: rev,
          data: new Uint8Array(buffer),
          initialized: fileExists,
        };
      }
    }
  }
  return {
    rev: '',
    data: undefined,
    initialized: fileExists,
  };
}

export async function saveAppFile(dbc: Dropbox, data: Uint8Array, appFileName: string, rev: string): Promise<string> {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const update: files.WriteModeUpdate = {
    '.tag': 'update',
    update: rev,
  };
  const add: files.WriteModeAdd = {
    '.tag': 'add',
  };
  const mode = rev == '' ? add : update;
  // noinspection SpellCheckingInspection
  return dbc
    .filesUpload({
      path: '/' + appFileName,
      contents: blob,
      mode: mode,
      autorename: true,
    })
    .then((response) => {
      return response.result.rev;
    })
    .catch((e) => {
      console.error('Error saving file to Dropbox: ', e);
      throw new Error(e);
    });
}

async function listFiles(dbc: Dropbox): Promise<string[]> {
  let response = await dbc.filesListFolder({ path: '' });
  if (response.result) {
    return response.result.entries.map((entry) => {
      if (entry.name) {
        return entry.name;
      }
      return '';
    });
  }
  return [];
}

function getAuthCodeFromUrl(locationSearch: string): string {
  const params = new URLSearchParams(locationSearch);
  return params.get('code')?.toString() || '';
}
