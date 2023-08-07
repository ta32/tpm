import { describe } from "@jest/globals";
import { TextDecoder, TextEncoder } from "util";
import { deserializeObject, serializeObject } from "./storage";

// Node.Js polyfills for WebAPIs
Object.assign(global, { TextDecoder, TextEncoder });

describe("serialization tests", () => {
  it("should not lose typed arrays when serializing", () => {
    interface Item {
      key: string;
    }
    const items: Item[] = [{ key: "key1" }, { key: "key2" }];
    const obj = {
      key: "key",
      items: items,
      values: new Uint8Array([1, 2, 3]),
    };

    const serialized = serializeObject(obj);
    const objActual = deserializeObject<any>(serialized);

    expect(objActual.key).toEqual(obj.key);
    expect(objActual.values).toEqual(obj.values);
    expect(ArrayBuffer.isView(objActual.values)).toEqual(true);
  });
});
