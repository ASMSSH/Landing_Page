import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { applyReducer, initialApplyState, type ApplyAction, type ApplyState } from './state';

interface ApplyContextValue {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
}

const ApplyContext = createContext<ApplyContextValue | null>(null);

export function ApplyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(applyReducer, initialApplyState);
  return <ApplyContext.Provider value={{ state, dispatch }}>{children}</ApplyContext.Provider>;
}

export function useApply(): ApplyContextValue {
  const ctx = useContext(ApplyContext);
  if (!ctx) throw new Error('useApply must be used within ApplyProvider');
  return ctx;
}
