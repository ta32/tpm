// extracted into module because https://github.com/jsdom/jsdom/issues/2555
// jsdom (polyfill for browser environment in node.js for testing) does not support Blob.arrayBuffer() yet
export async function readBlob(blobParts: Uint8Array): Promise<ArrayBuffer> {
  const fileBlob = new Blob([blobParts], { type: 'application/octet-stream' });
  return await fileBlob.arrayBuffer();
}

export function uniqueId(): string {
  const rnd = Math.random().toString(36).substring(2);
  const time = Date.now().toString(36);
  return rnd + time;
}
