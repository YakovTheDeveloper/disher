import { Text } from '@/shared/ui/atoms/Typography';
import styles from './FieldError.module.scss';

// The visible half of the inline-field a11y harness (pairs with useFieldError).
// Mirrors the AuthForm reference (AuthForm.tsx:158-162): a `role="alert"` <p>
// with a stable `id` (matched by the input's `aria-describedby`) so a screen
// reader announces the message and points at the offending field. Renders
// nothing when `message` is falsy — a valid field stays bare (no empty node,
// no reserved space), preserving backward-compat for consumers that inline it.

interface FieldErrorProps {
  /** Stable id — must match the input's `aria-describedby` (use `errorId`). */
  id: string;
  /** Error text, or null/'' when the field is valid (renders nothing). */
  message: string | null | undefined;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className={styles.error} role="alert">
      <Text as="span" role="caption">
        {message}
      </Text>
    </p>
  );
}

export default FieldError;
