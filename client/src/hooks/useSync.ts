import { useCallback, useRef } from 'react';
import { syncApi, Record, SyncRecord } from '../api';

const LAST_SYNC_KEY = 'lastSync';

export function useSync() {
  const pendingRecordsRef = useRef<SyncRecord[]>([]);

  // Get last sync timestamp from localStorage
  const getLastSync = useCallback((): string | null => {
    return localStorage.getItem(LAST_SYNC_KEY);
  }, []);

  // Save last sync timestamp to localStorage
  const setLastSync = useCallback((timestamp: string) => {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  }, []);

  // Push local pending records to server
  const pushPendingRecords = useCallback(async (): Promise<Record[]> => {
    if (pendingRecordsRef.current.length === 0) {
      return [];
    }

    const recordsToPush = [...pendingRecordsRef.current];
    pendingRecordsRef.current = [];

    try {
      const res = await syncApi.push(recordsToPush);
      setLastSync(res.data.lastSync);
      return res.data.created;
    } catch (err) {
      console.error('Failed to push pending records:', err);
      // Re-add to pending on failure
      pendingRecordsRef.current = [...recordsToPush, ...pendingRecordsRef.current];
      return [];
    }
  }, [setLastSync]);

  // Pull new records from server
  const pullNewRecords = useCallback(async (): Promise<Record[]> => {
    const lastSync = getLastSync();

    try {
      const res = await syncApi.getNew(lastSync);
      if (res.data.lastSync) {
        setLastSync(res.data.lastSync);
      }
      return res.data.records || [];
    } catch (err) {
      console.error('Failed to pull new records:', err);
      return [];
    }
  }, [getLastSync, setLastSync]);

  // Full sync: push pending then pull new
  const sync = useCallback(async (): Promise<Record[]> => {
    // First push any pending records
    await pushPendingRecords();

    // Then pull new records from server
    const newRecords = await pullNewRecords();

    return newRecords;
  }, [pushPendingRecords, pullNewRecords]);

  // Add a record to pending queue (for offline-first)
  const addPendingRecord = useCallback((record: SyncRecord) => {
    pendingRecordsRef.current.push(record);
  }, []);

  // Create a sync-ready record object
  const createSyncRecord = useCallback((
    babyId: string,
    type: SyncRecord['type'],
    data: SyncRecord['data']
  ): SyncRecord => {
    return {
      babyId,
      type,
      data,
      clientCreatedAt: new Date().toISOString(),
    };
  }, []);

  return {
    sync,
    pushPendingRecords,
    pullNewRecords,
    addPendingRecord,
    createSyncRecord,
    getLastSync,
  };
}
