import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, useColorScheme, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { PRESET_TOPICS, MAX_CUSTOM_KEYWORDS } from '../constants/topics';
import { storage, KEYS } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const [selectedTopics, setSelectedTopics] = useState(['tech', 'privacy']);
  const [customKeywords, setCustomKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [blueskyHandle, setBlueskyHandle] = useState('');
  const [mastodonHandle, setMastodonHandle] = useState('');

  const loadSettings = async () => {
    const topics = await storage.get(KEYS.SELECTED_TOPICS);
    const keywords = await storage.get(KEYS.CUSTOM_KEYWORDS);
    const bsky = await storage.get(KEYS.BLUESKY_HANDLE);
    const masto = await storage.get(KEYS.MASTODON_HANDLE);
    console.log('Settings loaded topics:', topics);
    console.log('Settings loaded keywords:', keywords);
    if (topics) setSelectedTopics(topics);
    if (keywords) setCustomKeywords(keywords);
    if (bsky) setBlueskyHandle(bsky);
    if (masto) setMastodonHandle(masto);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const toggleTopic = async (topicId) => {
    const next = selectedTopics.includes(topicId)
      ? selectedTopics.filter(id => id !== topicId)
      : [...selectedTopics, topicId];
    setSelectedTopics(next);
    await storage.set(KEYS.SELECTED_TOPICS, next);
  };

  const addKeyword = async () => {
    const kw = newKeyword.trim();
    if (!kw || customKeywords.includes(kw)) return;
    if (customKeywords.length >= MAX_CUSTOM_KEYWORDS) {
      Alert.alert('Limit reached', `Max ${MAX_CUSTOM_KEYWORDS} keywords`);
      return;
    }
    const next = [...customKeywords, kw];
    setCustomKeywords(next);
    await storage.set(KEYS.CUSTOM_KEYWORDS, next);
    setNewKeyword('');
  };

  const removeKeyword = async (kw) => {
    const next = customKeywords.filter(k => k !== kw);
    setCustomKeywords(next);
    await storage.set(KEYS.CUSTOM_KEYWORDS, next);
  };

  const saveHandle = async (type, value) => {
    const key = type === 'bluesky' ? KEYS.BLUESKY_HANDLE : KEYS.MASTODON_HANDLE;
    await storage.set(key, value);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionHeader, { color: C.secondary }]}>SOCIAL ACCOUNTS</Text>
      <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <View style={styles.inputRow}>
          <Text style={styles.platformIcon}>🦋</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: C.secondary }]}>Bluesky Handle</Text>
            <TextInput
              style={[styles.input, { color: C.text, borderColor: C.border }]}
              placeholder="user.bsky.social"
              placeholderTextColor={C.secondary}
              value={blueskyHandle}
              onChangeText={setBlueskyHandle}
              onBlur={() => saveHandle('bluesky', blueskyHandle)}
              autoCapitalize="none"
            />
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: C.border }]} />
        <View style={styles.inputRow}>
          <Text style={styles.platformIcon}>🐘</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: C.secondary }]}>Mastodon Handle</Text>
            <TextInput
              style={[styles.input, { color: C.text, borderColor: C.border }]}
              placeholder="user@mastodon.social"
              placeholderTextColor={C.secondary}
              value={mastodonHandle}
              onChangeText={setMastodonHandle}
              onBlur={() => saveHandle('mastodon', mastodonHandle)}
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: C.secondary }]}>
        TOPICS ({selectedTopics.length}/12)
      </Text>
      <View style={styles.topicsGrid}>
        {PRESET_TOPICS.map(topic => {
          const selected = selectedTopics.includes(topic.id);
          return (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicChip,
                {
                  backgroundColor: selected ? Colors.primary : C.cardBg,
                  borderColor: selected ? Colors.primary : C.border,
                }
              ]}
              onPress={() => toggleTopic(topic.id)}
            >
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              <Text style={[styles.topicLabel, { color: selected ? '#fff' : C.text }]}>
                {topic.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionHeader, { color: C.secondary }]}>
        CUSTOM KEYWORDS ({customKeywords.length}/{MAX_CUSTOM_KEYWORDS})
      </Text>
      <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <View style={styles.keywordInputRow}>
          <TextInput
            style={[styles.keywordInput, { color: C.text, borderColor: C.border }]}
            placeholder="Add keyword..."
            placeholderTextColor={C.secondary}
            value={newKeyword}
            onChangeText={setNewKeyword}
            onSubmitEditing={addKeyword}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, { opacity: newKeyword.trim() ? 1 : 0.4 }]}
            onPress={addKeyword}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {customKeywords.length > 0 && (
          <View style={styles.keywordsWrap}>
            {customKeywords.map((kw, i) => (
              <View key={i} style={[styles.kwTag, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.kwText, { color: C.text }]}>{kw}</Text>
                <TouchableOpacity onPress={() => removeKeyword(kw)}>
                  <Ionicons name="close" size={14} color={C.secondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  sectionHeader: {
    fontSize: Typography.fontSizes.xs, fontWeight: '700',
    letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md,
  },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  platformIcon: { fontSize: 24, marginTop: 18 },
  inputLabel: { fontSize: Typography.fontSizes.xs, fontWeight: '600', marginBottom: 4 },
  input: {
    fontSize: Typography.fontSizes.md, borderWidth: 1,
    borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 8,
  },
  divider: { height: 1, marginVertical: Spacing.md },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  topicChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
  },
  topicEmoji: { fontSize: 15 },
  topicLabel: { fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  keywordInputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  keywordInput: {
    flex: 1, fontSize: Typography.fontSizes.md,
    borderWidth: 1, borderRadius: BorderRadius.sm,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  addBtn: {
    backgroundColor: Colors.primary, width: 38, height: 38,
    borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center',
  },
  keywordsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  kwTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  kwText: { fontSize: Typography.fontSizes.sm },
});