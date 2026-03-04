/**
 * Scroll utilities for reliable scrolling to elements within a container.
 * Uses direct scrollTop manipulation instead of scrollIntoView for better cross-browser compatibility.
 */

/**
 * Scrolls to an element within a specific container.
 *
 * @param containerId - The ID of the scrollable container
 * @param elementId - The ID of the target element to scroll to
 * @param options - Optional configuration for scroll behavior
 */
export function scrollToElement(
    containerId: string,
    elementId: string,
    options: { behavior?: 'smooth' | 'auto'; delay?: number } = {}
): void {
    const { behavior = 'auto', delay = 0 } = options;

    const doScroll = () => {
        const container = document.getElementById(containerId);
        const element = document.getElementById(elementId);

        if (!container || !element) {
            return;
        }

        // Calculate scroll position: element's offset relative to the container
        const scrollTop = element.offsetTop - container.offsetTop;

        container.scrollTo({
            top: scrollTop,
            behavior,
        });
    };

    if (delay > 0) {
        setTimeout(doScroll, delay);
    } else {
        doScroll();
    }
}