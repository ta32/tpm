import { Dropbox, DropboxAuth, DropboxResponse, files } from 'dropbox'
import { appFileName } from './appfile'
import { readBlob } from './utils'
import { User } from '../contexts/reducers/users'

// App key from dropbox app console. This is not secret.
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

export function hasRedirectedFromAuth () {
  return window.location.search.includes('code=')
}

export async function connectDropbox(redirectUri: string, codeVerifier: string): Promise<Dropbox> {
  const dbxAuth = new DropboxAuth({ clientId: CLIENT_ID });
  dbxAuth.setCodeVerifier(codeVerifier);
  let response: DropboxResponse<any> = await dbxAuth.getAccessTokenFromCode(redirectUri, getAuthCodeFromUrl());
  if (response.result.access_token) {
    dbxAuth.setAccessToken(response.result.access_token);
    return new Dropbox({ auth: dbxAuth });
  }
  throw new Error("No access token");
}

export async function readAppFile(masterPublicKey: string, dbc: Dropbox): Promise<{data: Uint8Array|undefined, rev: string, initialized: boolean}> {
  const fileName = await appFileName(masterPublicKey);
  const files = await listFiles(dbc)
  const fileExists = files.includes(fileName);
  if (fileExists) {
    const response = await dbc.filesDownload({ path: '/' + fileName })
    if(response.result) {
      // need to cast as any to access fileBlob property
      // https://www.dropboxforum.com/t5/Dropbox-API-Support-Feedback/Javascript-API-Clarity-filesDownload/td-p/282827
      let metaData: any = response.result;
      if(metaData.fileBlob) {
        const rev = metaData.rev;
        const buffer = await readBlob(metaData.fileBlob);
        return {
          rev: rev,
          data: new Uint8Array(buffer),
          initialized: fileExists,
        }
      }
    }
  }
  return {
    rev: '',
    data: undefined,
    initialized: fileExists,
  }
}

export async function saveAppFile(dbc: Dropbox, data: Uint8Array, appFileName: string, rev: string): Promise<string> {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const update: files.WriteModeUpdate = {
    '.tag': 'update',
    update: rev
  };
  const add: files.WriteModeAdd = {
    '.tag': 'add'
  }
  const mode =  rev == "" ? add : update;
  // noinspection SpellCheckingInspection
  return dbc.filesUpload({ path: '/' + appFileName, contents: blob, mode: mode, autorename: true})
    .then((response) => {
      return response.result.rev;
    }).catch((e) => {
      throw new Error(e);
  });
}

async function listFiles(dbc: Dropbox): Promise<string[]> {
  let response = await dbc.filesListFolder({ path: '' });
  if(response.result) {
    return response.result.entries.map((entry) => {
      if (entry.name) {
        return entry.name;
      }
      return '';
    })
  }
  return [];
}

function getAuthCodeFromUrl (): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('code')?.toString() || ''
}
