import React, { createContext, useContext, useState, useEffect } from 'react';
import { JournalEntry, MonthCapitalConfig, PublishStatus, EmotionalState } from '../types/journal';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';

interface PublishPayload {
  exitPrice: number;
  netPnL: number;
  rMultiple: number;
  emotionalState: EmotionalState;
  ruleCompliance: number;
  mistakesMade?: string;
}

interface JournalContextType {
  journals: JournalEntry[];
  capitalConfigs: MonthCapitalConfig[];
  addJournal: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<JournalEntry>;
  updateJournal: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournal: (id: string) => void;
  publishJournal: (id: string, payload: PublishPayload) => Promise<boolean>;
  pushJournal: (journalId: string, targetUsername: string) => boolean;
  updateCapital: (year: number, month: number, capital: number) => void;
  getMyJournals: () => JournalEntry[];
  getPushedJournals: () => JournalEntry[];
  refreshJournals: () => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [capitalConfigs, setCapitalConfigs] = useState<MonthCapitalConfig[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      year: new Date().getFullYear(),
      month: i,
      capital: 10000
    }));
  });

  const refreshJournals = async () => {
    const remote = await SupabaseService.getJournals();
    if (remote) {
      setJournals(remote);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const remote = await SupabaseService.getJournals();
      if (mounted && remote) setJournals(remote);
    })();
    return () => { mounted = false; };
  }, [currentUser?.id]);

  // Only show current user's own journals (account isolation)
  const getMyJournals = (): JournalEntry[] => {
    if (!currentUser) return [];
    return journals.filter(j => j.userId === currentUser.id && !j.isPushed);
  };

  // Journals pushed TO the current user
  const getPushedJournals = (): JournalEntry[] => {
    if (!currentUser) return [];
    return journals.filter(j =>
      j.pushedTo?.some(p => p.sharedWithUsername.toLowerCase() === currentUser.username.toLowerCase())
    );
  };

  const addJournal = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> => {
    const remoteEntry = await SupabaseService.createJournal(entry);
    if (remoteEntry) {
      setJournals(prev => [remoteEntry, ...prev]);
      return remoteEntry;
    }
    const fallback: JournalEntry = {
      ...entry,
      id: `jrn_temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pushedTo: entry.pushedTo || [],
    };
    console.error('[JournalContext] addJournal: Supabase insert failed.');
    return fallback;
  };

  const updateJournal = (id: string, updates: Partial<JournalEntry>) => {
    setJournals(prev => prev.map(j => j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j));
    SupabaseService.updateJournal(id, updates);
  };

  const deleteJournal = (id: string) => {
    setJournals(prev => prev.filter(j => j.id !== id));
    SupabaseService.deleteJournal(id);
  };

  const publishJournal = async (id: string, payload: PublishPayload): Promise<boolean> => {
    const ok = await SupabaseService.publishJournal(id, payload);
    if (ok) {
      setJournals(prev => prev.map(j => j.id === id ? {
        ...j,
        ...payload,
        publishStatus: 'PUBLISHED' as PublishStatus,
        result: payload.netPnL > 0 ? 'WIN' : payload.netPnL < 0 ? 'LOSS' : 'BE',
        updatedAt: new Date().toISOString(),
      } : j));
    }
    return ok;
  };

  const pushJournal = (journalId: string, targetUsername: string): boolean => {
    if (!currentUser) return false;
    const journal = journals.find(j => j.id === journalId);
    if (!journal) return false;

    // Must be published before pushing
    if (journal.publishStatus !== 'PUBLISHED') return false;

    const targetUser = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (!targetUser) return false;

    const alreadyShared = journal.pushedTo?.some(
      p => p.sharedWithUsername.toLowerCase() === targetUsername.toLowerCase()
    );
    if (alreadyShared) return false;

    const shareRecord = {
      sharedWithUsername: targetUser.username,
      sharedAt: new Date().toISOString(),
      sharedByUsername: currentUser.username,
    };

    updateJournal(journalId, { pushedTo: [...(journal.pushedTo || []), shareRecord] });
    SupabaseService.pushJournal(journalId, currentUser.id, targetUser.id);
    return true;
  };

  const updateCapital = (year: number, month: number, capital: number) => {
    setCapitalConfigs(prev => {
      const existing = prev.findIndex(c => c.year === year && c.month === month);
      if (existing >= 0) {
        return prev.map((c, i) => i === existing ? { ...c, capital } : c);
      }
      return [...prev, { year, month, capital }];
    });
  };

  return (
    <JournalContext.Provider
      value={{
        journals,
        capitalConfigs,
        addJournal,
        updateJournal,
        deleteJournal,
        publishJournal,
        pushJournal,
        updateCapital,
        getMyJournals,
        getPushedJournals,
        refreshJournals
      }}
    >
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = (): JournalContextType => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
