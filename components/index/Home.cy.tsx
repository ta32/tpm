/// <reference types="cypress" />
import { Inter } from "next/font/google";
import React from 'react'
import Home from './Home'
import { UserProvider } from 'contexts/use-user';
import * as NextImage from 'next/image';
import { IMAGE_FILE } from 'lib/images';

const inter = Inter({ subsets: ['latin'] });

describe('<Home />', () => {
  beforeEach(() => {
    IMAGE_FILE.getPaths().forEach((image) => {
      cy.readFile(`Public${image}`, null).then((img) => {
        // Intercept requests to Next.js backend image endpoint
        cy.intercept('_next/image*', {
          statusCode: 200,
          headers: { 'Content-Type': 'image/png' },
          body: img.buffer,
        });
      });
    });
  });

  it('renders', () => {
    cy.viewport(1920,1080);
    const voidFunc = () => {};
    cy.mount(
      <div className={inter.className} style={{margin: 0}}>
        <UserProvider>
          <Home loading={true} openDevice={voidFunc} enterPin={voidFunc} handleLogout={voidFunc} handleDropBoxSignIn={voidFunc}/>
        </UserProvider>
      </div>
    )
  })
})
