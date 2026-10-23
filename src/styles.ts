/** Shared visual primitives; defaults stay inside each component's shadow root. */
export const hostStyles = `
  :host {
    display: block;
    color: var(--h6-text, #171717);
    font-family: var(--h6-font-family, ui-sans-serif, system-ui, sans-serif);
    font-size: var(--h6-font-size, .875rem);
    font-weight: 400;
    line-height: var(--h6-line-height, 1.25rem);
    letter-spacing: normal;
  }
  *, *::before, *::after { box-sizing: border-box; }
`;

export const inputStyles = `
  input {
    display: block;
    width: 100%;
    min-width: 0;
    height: var(--h6-control-height, 2.5rem);
    padding: .5rem .75rem;
    border: 1px solid var(--h6-border, #d4d4d4);
    border-radius: var(--h6-radius, .5rem);
    background: var(--h6-surface, #fff);
    color: var(--h6-text, #171717);
    font: inherit;
    font-size: var(--h6-font-size, .875rem);
    line-height: var(--h6-line-height, 1.25rem);
    box-shadow: 0 1px 2px #00000005;
    outline: none;
  }
  input::placeholder { color: var(--h6-placeholder, #737373); opacity: 1; }
  input:focus { border-color: var(--h6-focus, #737373); }
  input:focus-visible { outline: 2px solid var(--h6-focus, #737373); outline-offset: 2px; box-shadow: none; }
  input:disabled { opacity: .5; cursor: not-allowed; }
  :host([data-touched]:invalid) input { border-color: var(--h6-danger, #b91c1c); }
`;
