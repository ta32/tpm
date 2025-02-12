import React from 'react';
import { SVGProps } from 'react';
import svgPath from 'assets/ui/device.svg';

// Copied the path from glyph-name="device" in the "icomoon.svg" file in the original project
// used https://yqnn.github.io/svg-path-editor/ to get the view box correct
export default function DeviceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-655.984 -704 287 512" {...props}>
      <path d={svgPath} />
    </svg>
  );
}
