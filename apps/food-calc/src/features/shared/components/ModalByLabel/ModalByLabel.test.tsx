import { render } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ModalByLabel from './ModalByLabel';

// The `container` prop is load-bearing for overlay z-order: when a host modal
// (e.g. «Гипотезы») passes a node inside its own Dialog popup, the overlay joins
// that popup's stacking context, so a real modal opened on top (delete
// ConfirmModal) still paints above it. Without a container it falls back to the
// top-level `#modal-by-label-root`. These tests pin that routing.

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ModalByLabel — portal target', () => {
  it('portals its content INTO the provided container node', () => {
    const host = document.createElement('div');
    host.id = 'host-popup';
    document.body.appendChild(host);

    render(<ModalByLabel isExpanded container={host} content={<p>OVERLAY</p>} />);

    // Content lives inside the host node — not loose in document.body.
    expect(host.querySelector('p')?.textContent).toBe('OVERLAY');
  });

  it('falls back to #modal-by-label-root when no container is given', () => {
    const root = document.createElement('div');
    root.id = 'modal-by-label-root';
    document.body.appendChild(root);

    render(<ModalByLabel isExpanded content={<p>FALLBACK</p>} />);

    expect(root.querySelector('p')?.textContent).toBe('FALLBACK');
  });

  it('routes to the container even when collapsed (always-rendered overlay)', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    // isExpanded=false — the overlay is still mounted (collapsed via CSS), so it
    // must already be in the right place before the user opens it.
    render(<ModalByLabel isExpanded={false} container={host} content={<p>COLLAPSED</p>} />);

    expect(host.querySelector('p')?.textContent).toBe('COLLAPSED');
  });
});
