import React from 'react';
import { SVGProps } from 'react';
import svgPath from '/assets/tags/shopping_basket_FILL1_wght700_GRAD200_opsz48.svg';

export default function ShoppingBasketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" {...props}>
      <path d={svgPath} />
    </svg>
  );
}
