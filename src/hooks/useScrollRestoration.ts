import { useEffect, useCallback, useRef } from 'react';

const PRODUCT_KEY = 'highlighted-product-id';

const prefersReducedMotion = () => {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  } catch {
    return false;
  }
};

const getScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
  if (!element) return null;
  let current: HTMLElement | null = element.parentElement;
  while (current) {
    try {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const canScrollY = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
      if (canScrollY) return current;
    } catch {
      // noop
    }
    current = current.parentElement;
  }
  return null;
};

const scrollElementIntoView = (element: Element, opts?: { offsetTop?: number }) => {
  const offsetTop = opts?.offsetTop ?? 80;
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';

  const isSmallScreen = () => {
    try {
      return (
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(max-width: 768px)')?.matches ||
          window.matchMedia?.('(pointer: coarse)')?.matches)
      );
    } catch {
      return false;
    }
  };

  const el = element as HTMLElement;
  const scrollParent = typeof window !== 'undefined' ? getScrollableParent(el) : null;

  const adjustScroll = () => {
    // Fallback manual (especialmente útil en móviles con headers fijos)
    try {
      if (scrollParent) {
        const rect = el.getBoundingClientRect();
        const parentRect = scrollParent.getBoundingClientRect();
        const topWithinParent = rect.top - parentRect.top + scrollParent.scrollTop - offsetTop;
        scrollParent.scrollTo({ top: Math.max(0, topWithinParent), behavior });
        return;
      }

      const rect = el.getBoundingClientRect();
      const top = rect.top + (window.scrollY || window.pageYOffset) - offsetTop;
      window.scrollTo({ top: Math.max(0, top), behavior });
    } catch {
      // noop
    }
  };

  if (!isSmallScreen()) {
    try {
      // En desktop suele ser más estable y suave usando scrollIntoView y luego un ajuste.
      (element as any).scrollIntoView?.({ behavior, block: 'center', inline: 'nearest' });
    } catch {
      // Ignorar y usar fallback manual
    }
  }

  adjustScroll();

  // Ajuste extra: en móviles el layout puede seguir moviéndose (fonts/images/accordion)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      adjustScroll();
    });
  });
};

export const scrollToSelectorWithRetry = (opts: {
  selector: string;
  maxAttempts?: number;
  attemptDelayMs?: number;
  offsetTop?: number;
  onFound?: (el: HTMLElement) => void;
}): (() => void) => {
  const maxAttempts = opts.maxAttempts ?? 20;
  const attemptDelayMs = opts.attemptDelayMs ?? 120;
  const offsetTop = opts.offsetTop ?? 96;
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const tryFindAndScroll = (attempt = 0) => {
    if (cancelled) return;
    const el = document.querySelector(opts.selector) as HTMLElement | null;

    if (!el) {
      if (attempt < maxAttempts) {
        timeoutId = setTimeout(() => tryFindAndScroll(attempt + 1), attemptDelayMs);
      }
      return;
    }

    const doScroll = () => {
      if (cancelled) return;
      if (!el.isConnected) return;
      scrollElementIntoView(el, { offsetTop });
      opts.onFound?.(el);
    };

    requestAnimationFrame(() => requestAnimationFrame(doScroll));
  };

  tryFindAndScroll(0);

  return () => {
    cancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
};

export function useScrollRestoration(enabled: boolean = true) {
  const hasRestored = useRef(false);

  // Guardar ID del producto
  const saveScrollPosition = useCallback((productId?: string | null) => {
    if (!enabled || !productId) return;
    try {
      sessionStorage.setItem(PRODUCT_KEY, productId);
    } catch (error) {
      console.warn('Error al guardar:', error);
    }
  }, [enabled]);

  // Restaurar y destacar el producto
  const restoreScrollPosition = useCallback((): (() => void) | void => {
    if (!enabled || hasRestored.current) return;

    try {
      const productId = sessionStorage.getItem(PRODUCT_KEY);
      if (!productId) {
        hasRestored.current = true;
        return;
      }
      
      const maxAttempts = 20;
      const attemptDelayMs = 120;
      let cancelled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let clearHighlightTimeoutId: ReturnType<typeof setTimeout> | null = null;

      const tryFindAndScroll = (attempt = 0) => {
        if (cancelled) return;
        const element = document.querySelector(`[data-product-id="${productId}"]`);
        if (!element) {
          if (attempt < maxAttempts) {
            timeoutId = setTimeout(() => tryFindAndScroll(attempt + 1), attemptDelayMs);
          } else {
            hasRestored.current = true;
            sessionStorage.removeItem(PRODUCT_KEY);
          }
          return;
        }

        if (!(element as HTMLElement).isConnected) {
          if (attempt < maxAttempts) {
            timeoutId = setTimeout(() => tryFindAndScroll(attempt + 1), attemptDelayMs);
          }
          return;
        }

        // Expandir acordeón si es necesario
        const accordion = element.closest('[data-value]');
        if (accordion) {
          const trigger = accordion.querySelector('button');
          if (trigger && trigger.getAttribute('aria-expanded') === 'false') {
            trigger.click();
          }
        }

        const doScroll = () => {
          if (cancelled) return;
          if (!(element as HTMLElement).isConnected) return;
          scrollElementIntoView(element, { offsetTop: 96 });
          (element as HTMLElement).classList.add(
            'ring-4',
            'ring-blue-500',
            'ring-opacity-100',
            'bg-blue-50',
            'shadow-xl'
          );

          clearHighlightTimeoutId = setTimeout(() => {
            if (cancelled) return;
            if (!(element as HTMLElement).isConnected) return;
            (element as HTMLElement).classList.remove(
              'ring-4',
              'ring-blue-500',
              'ring-opacity-100',
              'bg-blue-50',
              'shadow-xl'
            );
          }, 4000);
          hasRestored.current = true;
          sessionStorage.removeItem(PRODUCT_KEY);
        };

        // Esperar 2 frames para que el DOM (y el accordion) termine de layout en móviles
        requestAnimationFrame(() => requestAnimationFrame(doScroll));
      };

      tryFindAndScroll(0);

      return () => {
        cancelled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (clearHighlightTimeoutId) {
          clearTimeout(clearHighlightTimeoutId);
          clearHighlightTimeoutId = null;
        }
        try {
          sessionStorage.removeItem(PRODUCT_KEY);
        } catch {
          // noop
        }
      };
    } catch (error) {
      console.warn('Error al restaurar:', error);
      hasRestored.current = true;
    }
  }, [enabled]);

  // Restaurar al montar
  useEffect(() => {
    if (enabled && !hasRestored.current) {
      const cleanup = restoreScrollPosition();
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [enabled, restoreScrollPosition]);

  const clearScrollPosition = useCallback(() => {
    sessionStorage.removeItem(PRODUCT_KEY);
    hasRestored.current = false;
  }, []);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  };
}
