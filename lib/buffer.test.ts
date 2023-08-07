import { hexFromUint8Array } from "./buffer";

it("should convert to hex", () => {
  const intArray = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(hexFromUint8Array(intArray)).toBe("00010203040506070809");

  const int255 = new Uint8Array([255]);
  expect(hexFromUint8Array(int255)).toBe("ff");

  const int155 = new Uint8Array([155]);
  expect(hexFromUint8Array(int155)).toBe("9b");
});
