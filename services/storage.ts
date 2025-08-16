// services/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// services/storage.ts
export type EntryItem = {
    name: string;
    calories: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    sugars?: number;
    fiber?: number;
    sodium?: number;
};

export type Entry = {
    id: string;        // unique id for this log (Date.now() is fine)
    date: string;      // YYYY-MM-DD
    items: EntryItem[];
    totalKcal: number; // rounded
};

const KEY = 'foodai/history:v1';

export async function getEntries(): Promise<Entry[]> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
}

export async function addEntry(e: Entry) {
    const list = await getEntries();
    list.unshift(e); // newest first
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getTodayTotal(todayISO: string): Promise<number> {
    const list = await getEntries();
    return list
        .filter(x => x.date === todayISO)
        .reduce((sum, x) => sum + (x.totalKcal || 0), 0);
}

export async function clearAllEntries(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}