/// <reference types="cypress" />
import { Inter } from "next/font/google";
import React from 'react'
import Home from './Home'
import { UserProvider } from 'contexts/use-user';
import * as NextImage from 'next/image';

const inter = Inter({ subsets: ['latin'] });

describe('<Home />', () => {
  it('renders', () => {

    // const imageStub = cy.stub().callsFake((props: any) => {
    //   return <img {...props} />;
    // })
    //
    // Object.defineProperty(NextImage, 'default', {
    //   configurable: true,
    //   value: imageStub,
    // });
    const voidFunc = () => {};
    cy.mount(
      <body className={inter.className}>
        <UserProvider>
          <Home loading={true} openDevice={voidFunc} enterPin={voidFunc} handleLogout={voidFunc} handleDropBoxSignIn={voidFunc}/>
        </UserProvider>
      </body>
    )
  })
})
