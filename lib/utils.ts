// extracted into module because https://github.com/jsdom/jsdom/issues/2555
// jsdom does not support Blob.arrayBuffer() yet
export async function readBlob(blobParts: Uint8Array): Promise<ArrayBuffer> {
  const fileBlob = new Blob([blobParts], { type: 'application/octet-stream' });
  return await fileBlob.arrayBuffer();
}
