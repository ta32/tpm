import { describe } from '@jest/globals'
import { TextDecoder, TextEncoder} from 'util';
import { deserializeObjectWithUint8Arrays, fromString, serializeObject } from './storage'

// nodeJs polyfills for WebAPIs
Object.assign(global, { TextDecoder, TextEncoder });

describe('serialization tests', () => {
  it('should return empty entries', () => {
    const emptyFile = '{"entries":[],"version":1}';
    const appFile: any = {
      rev: "1",
      data: emptyFile,
    }
    const expectedData = fromString(appFile.data);
    expect(expectedData.entries).toEqual([]);
    expect(expectedData.version).toEqual(1);
  });

  it('should return entries', () => {
    const file = '{"entries":[{"item":"test","title":"aasdf","username":"asdf","passwordEnc":{"0":73,"1":184,"2":52,"3":46,"4":175,"5":82,"6":143,"7":201,"8":79,"9":80,"10":228,"11":162,"12":19,"13":139,"14":40,"15":90,"16":88,"17":208,"18":180,"19":137,"20":141,"21":72,"22":148,"23":66,"24":20,"25":214,"26":6,"27":224,"28":163,"29":22,"30":62,"31":12},"secretNoteEnc":{"0":43,"1":23,"2":85,"3":200,"4":168,"5":40,"6":133,"7":44,"8":13,"9":165,"10":250,"11":192,"12":183,"13":4,"14":140,"15":211,"16":35,"17":30,"18":191,"19":194,"20":10,"21":184,"22":58,"23":216,"24":55,"25":180,"26":82,"27":36,"28":153,"29":129,"30":134,"31":46},"safeKey":"dd8b50e337c1ae94f02bac45e336a95f9cfe65d188c6f5f46c463117c1fdaa77","tags":"ethereum"}],"version":0}';
    const appFile: any = {
      rev: "1",
      data: file
    }
    const expectedData = fromString(appFile.data);
    expect(expectedData.entries.length).toEqual(1);
    expect(expectedData.entries[0].item).toEqual("test");
  });

  it('should not lose typed arrays when serializing', () => {
    const obj = {
      key: "key",
      values: new Uint8Array([1, 2, 3])
    };

    const serialized = serializeObject(obj);
    const objActual = deserializeObjectWithUint8Arrays<any>(serialized);

    expect(objActual.key).toEqual(obj.key);
    expect(objActual.values).toEqual(obj.values);
    expect(ArrayBuffer.isView(objActual.values)).toEqual(true);
  });

});
