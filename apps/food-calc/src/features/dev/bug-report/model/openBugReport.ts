import { modalStore } from '@/shared/ui';
import { getPwaTag } from '@/shared/lib/observability/pwaTag';
import { captureScreenshot } from './captureScreenshot';

// Guards against a second long-press while a capture is running or the form is
// already open (modalStore.show resolves only when the modal closes, so this
// stays true for the whole lifetime of the form).
let inFlight = false;

/**
 * Open the bug-report form immediately, capturing the screen in the background.
 *
 * The capture is kicked off but NOT awaited — the modal opens right away (snappy
 * UX) and shows a spinner until the screenshot resolves. `captureScreenshot`
 * excludes the modal/drawer portals, so the form never appears in its own
 * screenshot regardless of capture timing. The modal is imported lazily so it
 * (and snapdom) stay out of the main bundle — only the dev-gated
 * DesignVariantsBar references this function.
 */
export async function openBugReport(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const screenshotPromise = captureScreenshot();
    const { default: BugReportModal } = await import('../ui/BugReportModal');
    await modalStore.show(BugReportModal, {
      page: window.location.pathname + window.location.search,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
      pwa: getPwaTag(),
      screenshotPromise,
    });
  } finally {
    inFlight = false;
  }
}
