import { Component, Fragment, type ReactNode } from 'react';
import { reportError } from '@/shared/lib/errors/report';
import Text from '@/shared/ui/atoms/Typography/Text/Text';
import styles from './FeatureErrorBoundary.module.scss';

// A hand-rolled, dependency-free error boundary for a SINGLE fragile subtree
// (tier-1 render failure, see the "three tiers" model in linked-drifting-quill).
// The root Sentry.ErrorBoundary is the last-resort net that blanks the whole
// app; this one contains a render throw to its OWN section so the rest of the
// screen (top-bar, siblings) keeps working, reports through the shared pipeline
// (reportError → console → mutationLog → Sentry) and shows a localized fallback
// with «Попробовать снова» (re-keys the children so a transient throw can
// recover) + the grey support id «код: {refId}».

interface Props {
  children: ReactNode;
  /**
   * Custom fallback. Either a node, or a render-fn given `(reset, refId)` so a
   * caller can wire its own retry button. When omitted, the default section
   * fallback is shown (message + retry + refId).
   */
  fallback?: ReactNode | ((reset: () => void, refId: string | null) => ReactNode);
  /** Short section label woven into the default message («… в разделе X»). */
  label?: string;
  /** Ran after the user taps «Попробовать снова», before children re-mount. */
  onReset?: () => void;
  /**
   * When any value here changes, the boundary auto-resets (mirrors
   * react-error-boundary). Use to clear a caught error when the inputs that
   * caused it change (e.g. a new analysis id).
   */
  resetKeys?: readonly unknown[];
}

interface State {
  error: Error | null;
  refId: string | null;
  /** Bumped on every reset so the child subtree fully re-mounts (re-key). */
  nonce: number;
}

function keysChanged(a: readonly unknown[] = [], b: readonly unknown[] = []): boolean {
  return a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
}

export class FeatureErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, refId: null, nonce: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    const { refId } = reportError('render', error);
    this.setState({ refId });
  }

  override componentDidUpdate(prev: Props): void {
    // Auto-reset when resetKeys change AFTER an error was caught, so the parent
    // can recover the boundary declaratively without a manual retry tap.
    if (this.state.error && keysChanged(prev.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState((s) => ({ error: null, refId: null, nonce: s.nonce + 1 }));
  };

  override render(): ReactNode {
    const { error, refId, nonce } = this.state;
    if (!error) {
      // Re-key so a retry fully re-mounts the subtree (drops any bad state that
      // caused the throw), not just re-renders it.
      return <Fragment key={nonce}>{this.props.children}</Fragment>;
    }

    const { fallback, label } = this.props;
    if (typeof fallback === 'function') return fallback(this.reset, refId);
    if (fallback !== undefined) return fallback;

    return (
      <div className={styles.fallback} role="alert">
        <Text role="body" className={styles.message}>
          {label ? `Что-то сломалось в разделе «${label}»` : 'Что-то сломалось в этом разделе'}
        </Text>
        <button type="button" className={styles.retry} onClick={this.reset}>
          <Text as="span" role="label">Попробовать снова</Text>
        </button>
        {refId && (
          <Text role="caption" className={styles.refId}>
            код: {refId}
          </Text>
        )}
      </div>
    );
  }
}

export default FeatureErrorBoundary;
