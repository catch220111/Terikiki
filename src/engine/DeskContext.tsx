import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { MockAiClient } from '../ai/mockClient.ts';
import type { AiClient } from '../ai/client.ts';
import { deskReducer, initialDeskState, type DeskAction, type DeskState } from './deskState.ts';

interface DeskContextValue {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  ai: AiClient;
}

const DeskContext = createContext<DeskContextValue | null>(null);

interface Props {
  children: ReactNode;
  ai?: AiClient;
}

export function DeskProvider({ children, ai }: Props) {
  const [state, dispatch] = useReducer(deskReducer, initialDeskState);
  const client = useMemo(() => ai ?? new MockAiClient(), [ai]);
  const value = useMemo(() => ({ state, dispatch, ai: client }), [state, dispatch, client]);
  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk(): DeskContextValue {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error('useDesk must be used inside DeskProvider');
  return ctx;
}
