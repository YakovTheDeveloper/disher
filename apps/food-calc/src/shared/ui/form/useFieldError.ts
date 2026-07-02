import { useCallback, useId, useState } from 'react';

// Tiny, form-library-free a11y harness for a single inline-validated field.
// Deliberately NOT RHF/Zod — validators stay inline (quantity>0, norm>=0); this
// only owns the ACCESSIBILITY wiring (aria-invalid + aria-describedby to a
// stable id) and the error string, mirroring the AuthForm reference so a screen
// reader announces the error and points at it. Pair with <FieldError id={errorId}/>.

export interface FieldErrorControls {
  /** Current error message, or null when valid. */
  error: string | null;
  /** Set (or clear, with null) the field error. */
  setError: (message: string | null) => void;
  /** Clear the error. Call on change so a fixed field stops announcing. */
  clear: () => void;
  /** Stable id for the <FieldError> node — matches `fieldProps.aria-describedby`. */
  errorId: string;
  /** Spread onto the <input>: wires aria-invalid + aria-describedby when errored. */
  fieldProps: {
    'aria-invalid': true | undefined;
    'aria-describedby': string | undefined;
  };
}

export function useFieldError(): FieldErrorControls {
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const clear = useCallback(() => setError(null), []);

  return {
    error,
    setError,
    clear,
    errorId,
    fieldProps: {
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? errorId : undefined,
    },
  };
}
