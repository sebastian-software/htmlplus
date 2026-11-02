import { type FormEvent, useCallback, useEffect, useState } from "react";
import "htmlplus/combobox";
import "htmlplus/date-picker";
import "htmlplus/duration";
import "htmlplus/iban";
import "htmlplus/interval";
import "htmlplus/number-input";
import "htmlplus/select";
import "htmlplus/slider";
import "htmlplus/switch";
import "htmlplus/tags";
import "htmlplus/toggle-group";

const initial = {
  iban: "DE89370400440532013000",
  amount: "1.5",
  duration: "5400",
  date: "2028-02-29",
  tags: ["html", "forms"],
  budget: [200, 800] as readonly [number, number],
  choice: "a",
  fruit: "a",
  level: 40,
  formats: ["csv"],
  updates: true,
};

export function App() {
  const [state, setState] = useState(initial);
  const [log, setLog] = useState<string[]>([]);
  const [mounted, setMounted] = useState(true);
  const [submitted, setSubmitted] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  // React doesn't assign props to custom elements while hydrating, and the server can't render arrays as attributes.
  const tagsRef = useCallback((field: HTMLElementTagNameMap["h6-tags"] | null) => {
    if (field) field.value = initial.tags;
  }, []);
  const budgetRef = useCallback((field: HTMLElementTagNameMap["h6-interval"] | null) => {
    if (field) field.value = initial.budget;
  }, []);
  const formatsRef = useCallback((field: HTMLElementTagNameMap["h6-toggle-group"] | null) => {
    if (field) field.value = initial.formats;
  }, []);

  // Each field reports its events and copies its current value back into state, as a controlled React field does.
  const bind = <Key extends keyof typeof initial, Field extends HTMLElement>(
    key: Key,
    read: (field: Field) => (typeof initial)[Key],
  ) => ({
    onInput: (event: FormEvent<Field>) => {
      const value = read(event.currentTarget);
      setLog((items) => [...items, `${key}:input`]);
      setState((current) => ({ ...current, [key]: value }));
    },
    onChange: (event: FormEvent<Field>) => {
      const value = read(event.currentTarget);
      setLog((items) => [...items, `${key}:change`]);
      setState((current) => ({ ...current, [key]: value }));
    },
  });

  return (
    <main>
      <form
        id="fields"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(JSON.stringify([...new FormData(event.currentTarget)]));
        }}
      >
        {mounted && (
          <>
            <label htmlFor="iban">IBAN</label>
            <h6-iban id="iban" name="iban" value={state.iban} {...bind("iban", (field: HTMLElementTagNameMap["h6-iban"]) => field.value)} />
            <label htmlFor="amount">Amount</label>
            <h6-number-input id="amount" name="amount" step={0.01} value={state.amount} {...bind("amount", (field: HTMLElementTagNameMap["h6-number-input"]) => field.value)} />
            <label htmlFor="duration">Duration</label>
            <h6-duration id="duration" name="duration" value={state.duration} {...bind("duration", (field: HTMLElementTagNameMap["h6-duration"]) => field.value)} />
            <label htmlFor="date">Date</label>
            <h6-date-picker id="date" name="date" value={state.date} {...bind("date", (field: HTMLElementTagNameMap["h6-date-picker"]) => field.value)} />
            <label htmlFor="tags">Tags</label>
            <h6-tags id="tags" name="tags" ref={tagsRef} value={state.tags} {...bind("tags", (field: HTMLElementTagNameMap["h6-tags"]) => [...field.value])} />
            <label htmlFor="budget">Budget</label>
            <h6-interval id="budget" name="budget" ref={budgetRef} value={state.budget} {...bind("budget", (field: HTMLElementTagNameMap["h6-interval"]) => field.value as typeof initial.budget)} />
            <label htmlFor="choice">Choice</label>
            <h6-select id="choice" name="choice" value={state.choice} {...bind("choice", (field: HTMLElementTagNameMap["h6-select"]) => field.value)}>
              <option value="a">Apple</option>
              <option value="b">Banana</option>
            </h6-select>
            <label htmlFor="fruit">Fruit</label>
            <h6-combobox id="fruit" name="fruit" value={state.fruit} {...bind("fruit", (field: HTMLElementTagNameMap["h6-combobox"]) => field.value)}>
              <option value="a">Apple</option>
              <option value="b">Banana</option>
            </h6-combobox>
            <label htmlFor="level">Level</label>
            <h6-slider id="level" name="level" value={state.level} {...bind("level", (field: HTMLElementTagNameMap["h6-slider"]) => field.value)} />
            <label htmlFor="formats">Formats</label>
            <h6-toggle-group id="formats" name="formats" multiple ref={formatsRef} value={state.formats} {...bind("formats", (field: HTMLElementTagNameMap["h6-toggle-group"]) => [...(field.value as string[])])}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </h6-toggle-group>
            <label htmlFor="updates">Updates</label>
            <h6-switch id="updates" name="updates" value="email" checked={state.updates} {...bind("updates", (field: HTMLElementTagNameMap["h6-switch"]) => field.checked)} />
            {hydrated && (
              <>
                <label htmlFor="fallback">Reset default</label>
                <h6-iban id="fallback" name="fallback" defaultValue="AT611904300234573201" />
              </>
            )}
          </>
        )}
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </form>
      <button type="button" onClick={() => setState((current) => ({ ...current, iban: "GB82WEST12345698765432", amount: "42", duration: "60", date: "2030-01-15", tags: ["set"], budget: [1, 2], choice: "b", fruit: "b", level: 80, formats: ["json"], updates: false }))}>
        Set from React
      </button>
      <button type="button" onClick={() => setMounted((value) => !value)}>
        Toggle mount
      </button>
      <button type="button" onClick={() => setLog([])}>
        Clear log
      </button>
      <output id="log">{JSON.stringify(log)}</output>
      <output id="state">{JSON.stringify(state)}</output>
      <output id="submitted">{submitted}</output>
    </main>
  );
}
