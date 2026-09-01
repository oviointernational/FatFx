import React, { createContext, useContext, useState, useEffect } from 'react';
import { JournalEntry, MonthCapitalConfig } from '../types/journal';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';

interface JournalContextType {
  journals: JournalEntry[];
  capitalConfigs: MonthCapitalConfig[];
  addJournal: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<JournalEntry>;
  updateJournal: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournal: (id: string) => void;
  pushJournal: (journalId: string, targetUsername: string) => boolean;
  updateCapital: (year: number, month: number, capital: number) => void;
  getMyJournals: () => JournalEntry[];
  getPushedJournals: () => JournalEntry[];
  refreshJournals: () => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>(() => StorageService.getJournals());
  const [capitalConfigs, setCapitalConfigs] = useState<MonthCapitalConfig[]>(() => StorageService.getCapitalConfigs());

  const refreshJournals = async () => {
    const remote = await SupabaseService.getJournals();
    if (remote) {
      setJournals(remote);
      StorageService.saveJournals(remote);
    } else {
      setJournals(StorageService.getJournals());
    }
    setCapitalConfigs(StorageService.getCapitalConfigs());
  };

  useEffect(() => {
    refreshJournals();
  }, [currentUser?.id]);

  const saveJournals = (next: JournalEntry[]) => {
    setJournals(next);
    StorageService.saveJournals(next);
  };

  const getMyJournals = (): JournalEntry[] => {
    if (!currentUser) return [];
    return journals.filter(j => j.userId === currentUser.id && !j.isPushed);
  };

  const getPushedJournals = (): JournalEntry[] => {
    if (!currentUser) return [];
    return journals.filter(j =>
      (j.isPushed && j.pushedTo?.some(p => p.sharedWithUsername.toLowerCase() === currentUser.username.toLowerCase())) ||
      (j.pushedBy && j.userId === currentUser.id) ||
      (j.pushedTo?.some(p => p.sharedWithUsername.toLowerCase() === currentUser.username.toLowerCase()))
    );
  };

  const addJournal = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> => {
    const now = new Date().toISOString();
    const tempId = `jrn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newEntry: JournalEntry = {
      ...entry,
      id: tempId,
      createdAt: now,
      updatedAt: now,
      pushedTo: entry.pushedTo || [],
    };

    // Optimistic UI update
    const next = [newEntry, ...journals];
    saveJournals(next);

    // Sync remote
    const remoteEntry = await SupabaseService.createJournal(entry);
    if (remoteEntry) {
      const synced = next.map(j => (j.id === tempId ? remoteEntry : j));
      saveJournals(synced);
      return remoteEntry;
    }

    return newEntry;
  };

  const updateJournal = (id: string, updates: Partial<JournalEntry>) => {
    const next = journals.map(j => {
      if (j.id === id) {
        return { ...j, ...updates, updatedAt: new Date().toISOString() };
      }
      return j;
    });
    saveJournals(next);
    SupabaseService.updateJournal(id, updates);
  };

  const deleteJournal = (id: string) => {
    const next = journals.filter(j => j.id !== id);
    saveJournals(next);
    SupabaseService.deleteJournal(id);
  };

  const pushJournal = (journalId: string, targetUsername: string): boolean => {
    if (!currentUser) return false;
    const journal = journals.find(j => j.id === journalId);
    if (!journal) return false;

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

    const nextPushedTo = [...(journal.pushedTo || []), shareRecord];

    // Update original journal
    updateJournal(journalId, { pushedTo: nextPushedTo });

    // Sync remote share
    SupabaseService.pushJournal(journalId, currentUser.id, targetUser.id);
    return true;
  };

  const updateCapital = (year: number, month: number, capital: number) => {
    const existing = capitalConfigs.findIndex(c => c.year === year && c.month === month);
    let next: MonthCapitalConfig[];
    if (existing >= 0) {
      next = capitalConfigs.map((c, i) => i === existing ? { ...c, capital } : c);
    } else {
      next = [...capitalConfigs, { year, month, capital }];
    }
    setCapitalConfigs(next);
    StorageService.saveCapitalConfigs(next);
  };

  return (
    <JournalContext.Provider
      value={{
        journals,
        capitalConfigs,
        addJournal,
        updateJournal,
        deleteJournal,
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
