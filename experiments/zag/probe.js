import * as combobox from '@zag-js/combobox';
import { VanillaMachine, normalizeProps, spreadProps } from '@zag-js/vanilla';

const countries = [
  { value: 'AT', label: 'Austria' },
  { value: 'DE', label: 'Germany' },
  { value: 'NL', label: 'Netherlands' },
];
let sequence = 0;

// Isolated compatibility probe, not a production component or public API.
class ProbeCombobox extends HTMLElement {
  static formAssociated = true;
  internals = this.attachInternals();
  root = this.attachShadow({ mode: 'open', delegatesFocus: true });
  disabledByForm = false;

  constructor() {
    super();
    this.root.innerHTML = `<style>
      :host { display: inline-block; font: 14px system-ui; }
      [data-part=content] { background: white; border: 1px solid #aaa; margin: 0; padding: 4px; }
      [data-part=item] { list-style: none; padding: 4px; }
      [data-highlighted] { background: #ddd; }
      [hidden] { display: none !important; }
    </style><div class="root"><label>Country</label><div class="control">
    <input><button type="button">Choose</button></div></div>
    <div class="positioner"><ul></ul></div>`;
    this.nodes = Object.fromEntries(['.root', 'label', '.control', 'input', 'button', '.positioner', 'ul'].map(selector => [selector, this.root.querySelector(selector)]));
    this.items = countries.map(item => {
      const node = document.createElement('li');
      node.textContent = item.label;
      this.nodes.ul.append(node);
      return { item, node };
    });
  }

  connectedCallback() {
    this.machine = new VanillaMachine(combobox.machine, {
      id: `probe-${++sequence}`,
      getRootNode: () => this.root,
      collection: combobox.collection({ items: countries }),
      defaultValue: this.getAttribute('value') ? [this.getAttribute('value')] : [],
      disabled: this.disabledByForm || this.hasAttribute('disabled'),
      onValueChange: () => queueMicrotask(() => this.updateForm()),
      onInputValueChange: ({ inputValue, reason }) => {
        if (reason !== 'input-change') return;
        queueMicrotask(() => {
          this.filtered = countries.filter(item => item.label.toLowerCase().includes(inputValue.toLowerCase()));
          this.machine.updateProps({ collection: combobox.collection({ items: this.filtered }) });
          this.render();
        });
      },
    });
    this.unsubscribe = this.machine.subscribe(() => this.render());
    this.render();
    this.machine.start();
    this.updateForm();
  }

  disconnectedCallback() {
    this.unsubscribe?.();
    this.machine?.stop();
    this.cleanups?.forEach(cleanup => cleanup());
  }

  get api() { return combobox.connect(this.machine.service, normalizeProps); }
  get value() { return this.api.value[0] ?? ''; }
  set value(value) { this.api.setValue(value ? [value] : []); this.updateForm(); }

  render() {
    const api = this.api;
    this.cleanups = [
      spreadProps(this.nodes['.root'], api.getRootProps()),
      spreadProps(this.nodes.label, api.getLabelProps()),
      spreadProps(this.nodes['.control'], api.getControlProps()),
      spreadProps(this.nodes.input, api.getInputProps()),
      spreadProps(this.nodes.button, api.getTriggerProps()),
      spreadProps(this.nodes['.positioner'], api.getPositionerProps()),
      spreadProps(this.nodes.ul, api.getContentProps()),
      ...this.items.map(({ item, node }) => {
        const cleanup = spreadProps(node, api.getItemProps({ item }));
        node.hidden = !!this.filtered && !this.filtered.includes(item);
        return cleanup;
      }),
    ];
    this.nodes['.positioner'].hidden = !api.open;
  }

  updateForm() {
    const value = this.value;
    this.internals.setFormValue(value || null, value);
    this.internals.setValidity(this.hasAttribute('required') && !value ? { valueMissing: true } : {}, value ? '' : 'Choose a country.', this.nodes.input);
  }

  formResetCallback() {
    this.filtered = undefined;
    this.machine.updateProps({ collection: combobox.collection({ items: countries }) });
    this.value = this.getAttribute('value') ?? '';
    this.api.setOpen(false);
  }

  formDisabledCallback(disabled) {
    this.disabledByForm = disabled;
    this.machine?.updateProps({ disabled });
  }
}

customElements.define('probe-combobox', ProbeCombobox);
window.ready = true;
