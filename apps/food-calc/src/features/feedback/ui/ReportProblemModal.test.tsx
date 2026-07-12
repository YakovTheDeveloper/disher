import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import s from './ReportProblemModal.module.scss';

// Capture the props ReportProblemModal hands to ModalByLabel without mounting
// the real portal/content — this is a wiring guard for the show-stopper fix.
let captured: { className?: string; position?: string; isExpanded?: boolean } | null = null;
vi.mock('@/features/shared/components/ModalByLabel', () => ({
  ModalByLabel: (props: { className?: string; position?: string; isExpanded?: boolean }) => {
    captured = props;
    return null;
  },
}));

import { ReportProblemModal } from './ReportProblemModal';

describe('ReportProblemModal — overlay stacking wiring', () => {
  it('passes the raised-z-index overlay class + fixed position to ModalByLabel', () => {
    captured = null;
    render(<ReportProblemModal isExpanded={false} onClose={() => {}} />);

    expect(captured).not.toBeNull();
    expect(captured!.position).toBe('fixed');
    // `s.overlay` carries `z-index: 6001` (see ReportProblemModal.module.scss) so
    // the modal paints ABOVE the settings drawer (5001) it opens from. Dropping
    // this class regresses the show-stopper: the modal renders behind the drawer.
    expect(captured!.className).toBe(s.overlay);
  });
});
