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

// indicates file is a module
// https://stackoverflow.com/questions/57132428/augmentations-for-the-global-scope-can-only-be-directly-nested-in-external-modul
export {};

const within = (a: number, b: number, tol = 2) => Math.abs(a - b) <= tol;

// Helper: inject a vertical line overlay into the document so screenshots/visual tests can show alignment
function injectVLine(doc: Document, x: number, color = 'red', id = ''): HTMLElement {
  const win = doc.defaultView || window;
  // convert viewport X (boundingClientRect.left) to document/page X
  const pageX = Math.round(x + (win.pageXOffset ?? win.scrollX ?? 0));
  const pageHeight = Math.max(doc.documentElement?.scrollHeight || 0, doc.body?.scrollHeight || 0, win.innerHeight);

  const el = doc.createElement('div');
  el.setAttribute('data-cy-alignment', id || 'alignment-line');
  Object.assign(el.style, {
    position: 'absolute', // moves with the page content
    left: `${pageX}px`,
    top: '0px',
    height: `${pageHeight}px`, // cover full page height so it stays aligned when scrolling
    width: '1px',
    background: color,
    zIndex: '999999',
    pointerEvents: 'none',
    opacity: '0.5',
  } as CSSStyleDeclaration);

  doc.body.appendChild(el);
  return el;
}

function removeAlignmentLinesFromDoc(doc: Document) {
  const els = Array.from(doc.querySelectorAll('[data-cy-alignment]'));
  els.forEach((e) => e.remove());
}

// Add: inject a bounding-box highlight matching a DOMRect (used for visual debugging)
function injectBoxHighlight(doc: Document, rect: DOMRect, color = 'rgba(255,0,0,0.9)', id = ''): HTMLElement {
  const win = doc.defaultView || window;
  // convert viewport coordinates (boundingClientRect) to document/page coordinates
  const pageX = Math.round(rect.left + (win.pageXOffset ?? win.scrollX ?? 0));
  const pageY = Math.round(rect.top + (win.pageYOffset ?? win.scrollY ?? 0));

  const el = doc.createElement('div');
  el.setAttribute('data-cy-alignment', id || 'alignment-box');
  Object.assign(el.style, {
    position: 'absolute',
    left: `${pageX}px`,
    top: `${pageY}px`,
    width: `${Math.round(rect.width)}px`,
    height: `${Math.round(rect.height)}px`,
    boxSizing: 'border-box',
    border: `1px solid ${color}`,
    zIndex: '1000000',
    pointerEvents: 'none',
    opacity: '0.5',
  } as CSSStyleDeclaration);
  doc.body.appendChild(el);
  return el;
}

Cypress.Commands.add('shouldAlignLeft', (aSel: string, bSel: string, tol = 2, render = false) => {
  cy.get(aSel).then(($a) => {
    const a = $a[0].getBoundingClientRect();
    cy.get(bSel).then(($b) => {
      const b = $b[0].getBoundingClientRect();
      if (render) {
        cy.window()
          .then((win) => {
            // inject two vertical lines for visual debugging
            injectVLine(win.document, a.left, 'rgba(255,3,3,0.9)', 'alignment-a-left');
            injectVLine(win.document, b.left, 'rgba(255,0,0,0.9)', 'alignment-b-left');
            // inject bounding boxes for the elements: left=green, right=blue
            injectBoxHighlight(win.document, a, 'rgba(0,59,255,0.9)', 'alignment-box-a');
            injectBoxHighlight(win.document, b, 'rgba(0,177,253,0.9)', 'alignment-box-b');
          })
          .then(() => {
            expect(within(a.left, b.left, tol), `left edges: ${a.left} vs ${b.left}`).to.be.true;
          });
      } else {
        expect(within(a.left, b.left, tol), `left edges: ${a.left} vs ${b.left}`).to.be.true;
      }
    });
  });
});

Cypress.Commands.add('shouldAlignMiddleY', (aSel: string, bSel: string, tol = 2, render = false) => {
  const mid = (r: DOMRect) => r.top + r.height / 2;
  cy.get(aSel).then(($a) => {
    const a = $a[0].getBoundingClientRect();
    cy.get(bSel).then(($b) => {
      const b = $b[0].getBoundingClientRect();
      if (render) {
        cy.window().then((win) => {
          // inject horizontal lines by creating thin full-width divs positioned at mid Y
          const doc = win.document;
          const yA = Math.round(mid(a));
          const yB = Math.round(mid(b));
          const makeHLine = (y: number, color: string, id: string) => {
            const el = doc.createElement('div');
            el.setAttribute('data-cy-alignment', id);
            Object.assign(el.style, {
              position: 'fixed',
              left: '0',
              top: `${y}px`,
              width: '100vw',
              height: '2px',
              background: color,
              zIndex: '999999',
              pointerEvents: 'none',
              opacity: '0.8',
            } as CSSStyleDeclaration);
            doc.body.appendChild(el);
          };
          makeHLine(yA, 'rgba(255,165,0,0.9)', 'alignment-a-mid');
          makeHLine(yB, 'rgba(255,165,0,0.9)', 'alignment-b-mid');
          // inject bounding boxes for the elements: left=green, right=blue
          injectBoxHighlight(doc, a, 'rgba(0,128,0,0.9)', 'alignment-box-a');
          injectBoxHighlight(doc, b, 'rgba(0,122,255,0.9)', 'alignment-box-b');
        });
      }
      expect(within(mid(a), mid(b), tol), `vertical middles: ${mid(a)} vs ${mid(b)}`).to.be.true;
    });
  });
});

Cypress.Commands.add('clearAlignmentLines', () => {
  cy.window().then((win) => removeAlignmentLinesFromDoc(win.document));
});

// TypeScript augmentation for custom commands. Keep this consistent with other augmentations in the repo.
declare global {
  namespace Cypress {
    interface Chainable {
      /** Assert that the left edges of the two elements are aligned within `tol` pixels. Optional `render` will draw lines in the viewport. */
      shouldAlignLeft(aSel: string, bSel: string, tol?: number, render?: boolean): Chainable;
      /** Assert that the vertical middles of the two elements are aligned within `tol` pixels. Optional `render` will draw lines in the viewport. */
      shouldAlignMiddleY(aSel: string, bSel: string, tol?: number, render?: boolean): Chainable;
      /** Remove any alignment overlay lines injected by the other helpers. */
      clearAlignmentLines(): Chainable;
    }
  }
}
