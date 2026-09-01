import React, { createContext, useContext, useState, useEffect } from 'react';
import { Signal, SignalFilter, SignalStatus, CreateSignalPayload } from '../types/signal';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';

interface SignalContextType {
  signals: Signal[];
  selectedSignal: Signal | null;
  filter: SignalFilter;
  setSelectedSignal: (signal: Signal | null) => void;
  setFilter: React.Dispatch<React.SetStateAction<SignalFilter>>;
  addSignal: (payload: CreateSignalPayload) => Promise<Signal>;
  updateSignal: (id: string, updates: Partial<Signal>) => void;
  deleteSignal: (id: string) => void;
  shareSignal: (signalId: string, recipientUsername: string) => boolean;
  getSignalsByMonth: (year: number, month: number) => Signal[];
  getAvailableYears: () => number[];
  refreshSignals: () => void;
}

const SignalContext = createContext<SignalContextType | undefined>(undefined);

export const SignalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [signals, setSignals] = useState<Signal[]>(() => StorageService.getSignals());
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [filter, setFilter] = useState<SignalFilter>({
    year: new Date().getFullYear(),
  });

  const refreshSignals = async () => {
    const remote = await SupabaseService.getSignals();
    if (remote) {
      setSignals(remote);
      StorageService.saveSignals(remote);
    } else {
      setSignals(StorageService.getSignals());
    }
  };

  useEffect(() => {
    refreshSignals();
  }, [currentUser]);

  const saveSignals = (next: Signal[]) => {
    setSignals(next);
    StorageService.saveSignals(next);
  };

  const addSignal = async (payload: CreateSignalPayload): Promise<Signal> => {
    const now = new Date().toISOString();
    const tempId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newSignal: Signal = {
      ...payload,
      id: tempId,
      createdAt: now,
      updatedAt: now,
      sharedWith: payload.sharedWith || [],
    };

    const next = [newSignal, ...signals];
    saveSignals(next);

    // Sync remote
    const remoteSig = await SupabaseService.createSignal(payload);
    if (remoteSig) {
      const synced = next.map(s => (s.id === tempId ? remoteSig : s));
      saveSignals(synced);
      return remoteSig;
    }

    return newSignal;
  };

  const updateSignal = (id: string, updates: Partial<Signal>) => {
    const next = signals.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates, updatedAt: new Date().toISOString() };
        if (selectedSignal && selectedSignal.id === id) {
          setSelectedSignal(updated);
        }
        return updated;
      }
      return s;
    });
    saveSignals(next);
    SupabaseService.updateSignal(id, updates);
  };

  const deleteSignal = (id: string) => {
    const next = signals.filter(s => s.id !== id);
    saveSignals(next);
    if (selectedSignal && selectedSignal.id === id) {
      setSelectedSignal(null);
    }
    SupabaseService.deleteSignal(id);
  };

  const shareSignal = (signalId: string, recipientUsername: string): boolean => {
    const sig = signals.find(s => s.id === signalId);
    if (!sig) return false;

    const already = sig.sharedWith?.some(r => r.recipientUsername.toLowerCase() === recipientUsername.toLowerCase());
    if (already) return false;

    const updatedShared = [...(sig.sharedWith || []), { recipientUsername, sharedAt: new Date().toISOString() }];
    updateSignal(signalId, { sharedWith: updatedShared });
    return true;
  };

  const getSignalsByMonth = (year: number, month: number): Signal[] => {
    return signals.filter(s => {
      const matchYear = s.year === year;
      const matchMonth = s.month === month;
      const matchAsset = !filter.asset || s.asset.toLowerCase() === filter.asset.toLowerCase();
      const matchType = !filter.type || s.type === filter.type;
      const matchStatus = !filter.status || s.status === filter.status;
      return matchYear && matchMonth && matchAsset && matchType && matchStatus;
    });
  };

  const getAvailableYears = (): number[] => {
    const years = Array.from(new Set(signals.map(s => s.year)));
    const current = new Date().getFullYear();
    if (!years.includes(current)) years.push(current);
    return years.sort((a, b) => b - a);
  };

  return (
    <SignalContext.Provider
      value={{
        signals,
        selectedSignal,
        filter,
        setSelectedSignal,
        setFilter,
        addSignal,
        updateSignal,
        deleteSignal,
        shareSignal,
        getSignalsByMonth,
        getAvailableYears,
        refreshSignals
      }}
    >
      {children}
    </SignalContext.Provider>
  );
};

export const useSignals = (): SignalContextType => {
  const context = useContext(SignalContext);
  if (!context) {
    throw new Error('useSignals must be used within a SignalProvider');
  }
  return context;
};
