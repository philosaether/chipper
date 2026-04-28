/**
 * React hooks — also the headless API.
 *
 * These hooks are the same ones used internally by the built-in components.
 * Consumers import from 'chipper/headless' to use them without the default UI.
 */

export { SentenceProvider, type SentenceProviderProps } from './SentenceProvider';
export { useSentence } from './useSentence';
export { useChip } from './useChip';
export { usePopup } from './usePopup';
export type { SentenceContextValue, PopupState } from './context';
