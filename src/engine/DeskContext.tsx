import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { MockAiClient } from '../ai/mockClient.ts';
import type { AiClient } from '../ai/client.ts';
import type { MatchingService } from '../matching/service.ts';
import { StubMatchingService } from '../matching/stubMatcher.ts';
import { deskReducer, initialDeskState, type DeskAction, type DeskState } from './deskState.ts';

interface DeskContextValue {
  state: DeskState;
  dispatch: Dispatch<DeskAction>;
  ai: AiClient;
  matcher: MatchingService;
}

const DeskContext = createContext<DeskContextValue | null>(null);

interface Props {
  children: ReactNode;
  ai?: AiClient;
  matcher?: MatchingService;
}

export function DeskProvider({ children, ai, matcher }: Props) {
  const [state, dispatch] = useReducer(deskReducer, initialDeskState);
  const client = useMemo(() => ai ?? new MockAiClient(), [ai]);
  const matching = useMemo(() => matcher ?? new StubMatchingService(), [matcher]);
  const value = useMemo(
    () => ({ state, dispatch, ai: client, matcher: matching }),
    [state, dispatch, client, matching],
  );
  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk(): DeskContextValue {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error('useDesk must be used inside DeskProvider');
  return ctx;
}
