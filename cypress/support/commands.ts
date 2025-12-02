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

Cypress.Commands.add('shouldAlignLeft', (aSel: string, bSel: string, tol = 2, render = false) => {
  cy.get(aSel).then(($a) => {
    const a = $a[0].getBoundingClientRect();
    cy.get(bSel).then(($b) => {
      const b = $b[0].getBoundingClientRect();
      if (render) {
        // Highlight only the left edge of both elements (internal helper, not a public command)
        cy.window().then((win) => {
          highlightEdgesInternal(win.document, [aSel, bSel], { left: true }, 'rgba(0,177,253,0.9)', 2);
        }).then(() => {
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
        // Reuse edge-highlighting: show left and right edges for both elements
        cy.window().then((win) => {
          highlightEdgesInternal(win.document, [aSel, bSel], { left: true, right: true }, 'rgba(0,177,253,0.9)', 2);
        }).then(() => {
          expect(within(mid(a), mid(b), tol), `vertical middles: ${mid(a)} vs ${mid(b)}`).to.be.true;
        });
      } else {
        expect(within(mid(a), mid(b), tol), `vertical middles: ${mid(a)} vs ${mid(b)}`).to.be.true;
      }
    });
  });
});
// Add: highlight selectors by injecting CSS outlines (non-intrusive, no layout shift)
const HIGHLIGHT_STYLE_ID = 'cy-highlight-style';

// Internal helper: highlight specific edges using inset box-shadows to avoid layout shift
function highlightEdgesInternal(doc: Document, selectors: string[], edges: { left?: boolean; right?: boolean; top?: boolean; bottom?: boolean } = { left: true }, color = 'magenta', width = 2) {
  const shadowParts: string[] = [];
  if (edges.left) shadowParts.push(`inset ${width}px 0 0 0 ${color}`);
  if (edges.right) shadowParts.push(`inset -${width}px 0 0 0 ${color}`);
  if (edges.top) shadowParts.push(`inset 0 ${width}px 0 0 ${color}`);
  if (edges.bottom) shadowParts.push(`inset 0 -${width}px 0 0 ${color}`);
  const boxShadow = shadowParts.join(', ');

  const css = selectors
    .map((sel) => `\n${sel} {\n  box-shadow: ${boxShadow} !important;\n}\n`)
    .join('\n');

  let style = doc.getElementById(HIGHLIGHT_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = HIGHLIGHT_STYLE_ID;
    doc.head.appendChild(style);
  }
  style.textContent = (style.textContent || '') + '\n' + css;
}

Cypress.Commands.add('clearHighlights', () => {
  cy.window().then((win) => {
    const style = win.document.getElementById(HIGHLIGHT_STYLE_ID);
    if (style) style.remove();
  });
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
      /** Temporarily outline target elements to visually highlight them without altering layout. */
      highlightSelectors(selectors: string | string[], color?: string, width?: number): Chainable<void>;
      /** Remove temporary highlight outlines injected by `highlightSelectors`. */
      clearHighlights(): Chainable<void>;
    }
  }
}
