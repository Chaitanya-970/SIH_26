import { useState, useEffect } from 'react';

/**
 * CITADEL Sovereign Engineering Micro-Animation System
 * Strict, restrained, high-performance timing tokens and helpers.
 */

export const TIMING = {
  FAST: 160,     // 120–180ms: buttons, tabs, small toggles
  NORMAL: 260,   // 200–350ms: modals, dropdowns, state switches, cards
  PAGE: 500,     // 400–600ms: page enter, hero bay entrance
  STAGGER: 50,   // 40–70ms: list items, evidence cards, analysis rows
  AMBIENT: 700   // wireframe ball initial ambient load
};

export const EASING = {
  EASE_OUT: 'cubic-bezier(0.16, 1, 0.3, 1)',   // crisp industrial ease-out
  SMOOTH: 'cubic-bezier(0.2, 0, 0, 1)',
  PULSE: 'cubic-bezier(0.4, 0, 0.6, 1)'
};

export const ANIM_CLASSES = {
  pageEnter: 'anim-page-enter',
  navEnter: 'anim-nav-enter',
  heroEnter: 'anim-hero-enter',
  fadeUp: 'anim-fade-up',
  staggerItem: 'anim-stagger-item',
  cardItem: 'anim-card',
  dropdown: 'anim-dropdown',
  modalBackdrop: 'anim-modal-backdrop',
  modalContent: 'anim-modal-content',
  agentRunning: 'anim-agent-running',
  agentComplete: 'anim-agent-complete',
  checkmarkPop: 'anim-checkmark-pop',
  evidenceItem: 'anim-evidence-item',
  responseEnter: 'anim-response-enter',
  skeletonPulse: 'anim-skeleton-pulse',
  wireframeBall: 'anim-wireframe-ball'
};

/**
 * Returns inline style for staggered sequence delay
 * @param {number} index
 * @param {number} baseDelayMs
 */
export function staggerDelay(index, baseDelayMs = 0) {
  return {
    animationDelay: `${baseDelayMs + index * TIMING.STAGGER}ms`
  };
}

/**
 * React hook to detect user prefers-reduced-motion preference
 */
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e) => setPrefersReduced(e.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return prefersReduced;
}
