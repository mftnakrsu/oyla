import { Component, type ReactNode } from 'react';

/**
 * Shows `fallback` instead of crashing the page when a child throws, e.g. a question type's
 * component on unexpected data or a lazy chunk that disappeared after a redeploy. Key it by the
 * thing it wraps so a new question gets a fresh boundary.
 */
export class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
