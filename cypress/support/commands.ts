/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
const within = (a: number, b: number, tol = 2) => Math.abs(a - b) <= tol;

Cypress.Commands.add('shouldAlignLeft', (aSel: string, bSel: string, tol = 2) => {
  cy.get(aSel).then(($a) => {
    const a = $a[0].getBoundingClientRect();
    cy.get(bSel).then(($b) => {
      const b = $b[0].getBoundingClientRect();
      expect(within(a.left, b.left, tol), `left edges: ${a.left} vs ${b.left}`).to.be.true;
    });
  });
});

Cypress.Commands.add('shouldAlignMiddleY', (aSel: string, bSel: string, tol = 2) => {
  const mid = (r: DOMRect) => r.top + r.height / 2;
  cy.get(aSel).then(($a) => {
    const a = $a[0].getBoundingClientRect();
    cy.get(bSel).then(($b) => {
      const b = $b[0].getBoundingClientRect();
      expect(within(mid(a), mid(b), tol), `vertical middles: ${mid(a)} vs ${mid(b)}`).to.be.true;
    });
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      shouldAlignLeft(aSel: string, bSel: string, tol?: number): Chainable<JQuery<HTMLElement>>;
      shouldAlignMiddleY(aSel: string, bSel: string, tol?: number): Chainable<JQuery<HTMLElement>>;
    }
  }
}