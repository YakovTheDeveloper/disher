import type { MutableRefObject, Ref } from 'react';

/**
 * Combine multiple refs (object OR callback) into one callback ref — attach it to
 * a single element that must feed several consumers at once (e.g. a hook's
 * internal `RefObject` + a callback ref from another hook).
 *
 * Standard React idiom: writing each ref's `.current` here is intentional. The
 * refs arrive as opaque `Ref<T>` params, so this generic util is the sanctioned
 * place to mutate them — callers keep passing their hook-returned refs untouched
 * (satisfies `react-hooks/immutability`, which bans mutating a hook return in
 * component/hook scope).
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): (el: T | null) => void {
  return (el) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(el);
      else (ref as MutableRefObject<T | null>).current = el;
    }
  };
}
