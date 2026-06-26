import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SELECTED_TOPICS: 'selected_topics',
  CUSTOM_KEYWORDS: 'custom_keywords',
  BLUESKY_HANDLE: 'bluesky_handle',
  MASTODON_HANDLE: 'mastodon_handle',
};

export const storage = {
  async get(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch { return false; }
  },
};

export { KEYS };