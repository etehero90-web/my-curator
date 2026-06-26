import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { storage, KEYS } from './storage';

// 크롬 확장 토픽 ID → 모바일 앱 토픽 ID 매핑
const TOPIC_MAP = {
  'tech': 'tech',
  'game': 'gaming',
  'gaming': 'gaming',
  'news': 'politics',
  'politics': 'politics',
  'shopping': 'finance',
  'movie': 'culture',
  'music': 'culture',
  'culture': 'culture',
  'science': 'science',
  'privacy': 'privacy',
  'design': 'design',
  'startup': 'startup',
  'crypto': 'crypto',
  'health': 'health',
  'climate': 'climate',
  'finance': 'finance',
  'sports': 'health',
  'life': 'health',
  'art': 'culture',
};

// JSON 텍스트로 가져오기
export async function importFromText(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    console.log('Import data keys:', Object.keys(data));
    console.log('Import data:', JSON.stringify(data).slice(0, 200));

    // 데이터 검증
    if (!data.selectedTopics && !data.customKeywords && !data.curator_topics_count && !data.topicsCount && !data.searches) {
      return { success: false, message: 'Invalid file format' };
    }

    let importedTopics = [];
    let importedKeywords = [];

    // 웹앱 export 포맷 처리
    if (data.selectedTopics) {
      importedTopics = data.selectedTopics;
    }
    if (data.customKeywords) {
      importedKeywords = data.customKeywords;
    }

    // 크롬 확장 포맷 처리 (curator_topics_count)
    if (data.curator_topics_count) {
      const topTopics = Object.entries(data.curator_topics_count)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([topic]) => topic);
      importedTopics = [...new Set([...importedTopics, ...topTopics])];
    }

    // 크롬 확장 포맷 처리 (topicsCount - 새 포맷)
    if (data.topicsCount) {
      console.log('topicsCount:', JSON.stringify(data.topicsCount));
      const topTopics = Object.entries(data.topicsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([topic]) => TOPIC_MAP[topic] || null)
        .filter(Boolean);
      console.log('topTopics mapped:', topTopics);
      importedTopics = [...new Set([...importedTopics, ...topTopics])];
      console.log('importedTopics:', importedTopics);
    }

    // 검색어 기반 키워드 추출
    const searchData = data.curator_searches || data.searches || [];
    if (searchData.length > 0) {
      const freqMap = {};
      searchData.forEach(s => {
        const kw = (s.keyword || '').toLowerCase().trim();
        if (kw.length >= 2 && kw.length <= 20) {
          freqMap[kw] = (freqMap[kw] || 0) + (s.count || 1);
        }
      });
      const topKeywords = Object.entries(freqMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([kw]) => kw);
      importedKeywords = [...new Set([...importedKeywords, ...topKeywords])].slice(0, 10);
    }

    // 쇼핑 데이터도 키워드로 추출
    const shoppingData = data.shopping || [];
    if (shoppingData.length > 0) {
      const freqMap = {};
      shoppingData.forEach(s => {
        const kw = (s.keyword || '').toLowerCase().trim();
        if (kw.length >= 2 && kw.length <= 20) {
          freqMap[kw] = (freqMap[kw] || 0) + (s.count || 1) * 2;
        }
      });
      const topKeywords = Object.entries(freqMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw);
      importedKeywords = [...new Set([...importedKeywords, ...topKeywords])].slice(0, 10);
    }

    // 저장
    console.log('Saving topics:', importedTopics);
    console.log('Saving keywords:', importedKeywords);
    await storage.set(KEYS.SELECTED_TOPICS, importedTopics);
    await storage.set(KEYS.CUSTOM_KEYWORDS, importedKeywords);
    const saved = await storage.get(KEYS.SELECTED_TOPICS);
    console.log('Verified saved topics:', saved);

    return {
      success: true,
      topics: importedTopics,
      keywords: importedKeywords,
      message: `Imported ${importedTopics.length} topics and ${importedKeywords.length} keywords!`,
    };

  } catch (e) {
    console.log('Import error:', e.message);
    return { success: false, message: 'Failed to import: ' + e.message };
  }
}

// 현재 데이터 내보내기
export async function exportData() {
  try {
    const topics = await storage.get(KEYS.SELECTED_TOPICS) || [];
    const keywords = await storage.get(KEYS.CUSTOM_KEYWORDS) || [];
    const favUsers = await storage.get('favorite_users') || [];
    const favPosts = await storage.get('favorite_posts') || [];

    const exportObj = {
      exportedAt: new Date().toISOString(),
      appVersion: '1.1.0',
      selectedTopics: topics,
      customKeywords: keywords,
      favoriteUsers: favUsers.map(u => ({ handle: u.handle, displayName: u.displayName })),
      favoritePostsCount: favPosts.length,
    };

    return {
      success: true,
      data: JSON.stringify(exportObj, null, 2),
      filename: `my-curator-export-${new Date().toISOString().slice(0, 10)}.json`,
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}