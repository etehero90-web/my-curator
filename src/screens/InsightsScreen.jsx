import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  useColorScheme, Dimensions, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

function StatCard({ icon, label, value, sub, isDark }) {
  const C = isDark ? Colors.dark : Colors;
  return (
    <View style={[styles.statCard, { backgroundColor: C.cardBg, borderColor: C.border }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: C.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: C.secondary }]}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: Colors.primary }]}>{sub}</Text>}
    </View>
  );
}

function BarChart({ data, isDark }) {
  const C = isDark ? Colors.dark : Colors;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={styles.barChart}>
      {data.map((item, i) => (
        <View key={i} style={styles.barItem}>
          <View style={styles.barTrack}>
            <View style={[
              styles.barFill,
              { height: `${(item.value / max) * 100}%`, backgroundColor: Colors.primary }
            ]} />
          </View>
          <Text style={[styles.barLabel, { color: C.secondary }]}>{item.label}</Text>
          <Text style={[styles.barValue, { color: C.text }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function InsightsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const weeklyData = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 28 },
    { label: 'Wed', value: 19 },
    { label: 'Thu', value: 35 },
    { label: 'Fri', value: 41 },
    { label: 'Sat', value: 22 },
    { label: 'Sun', value: 16 },
  ];

  const topTopics = [
    { topic: 'Technology', count: 48, emoji: '💻' },
    { topic: 'Privacy', count: 31, emoji: '🔒' },
    { topic: 'Startup', count: 24, emoji: '🚀' },
    { topic: 'Design', count: 18, emoji: '🎨' },
    { topic: 'Science', count: 12, emoji: '🔬' },
  ];

  const maxCount = topTopics[0].count;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsGrid}>
        <StatCard icon="📰" label="Posts Curated" value="173" sub="+12 today" isDark={isDark} />
        <StatCard icon="🎯" label="Topics Active" value="5" isDark={isDark} />
        <StatCard icon="⚡" label="Data Saved" value="2.4MB" isDark={isDark} />
        <StatCard icon="🔒" label="Trackers Blocked" value="89" isDark={isDark} />
      </View>

      <View style={[styles.section, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Weekly Activity</Text>
        <BarChart data={weeklyData} isDark={isDark} />
      </View>

      <View style={[styles.section, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Top Topics</Text>
        {topTopics.map((item, i) => (
          <View key={i} style={styles.topicRow}>
            <Text style={[styles.topicRank, { color: C.secondary }]}>{i + 1}</Text>
            <Text style={styles.topicEmoji}>{item.emoji}</Text>
            <View style={styles.topicBarWrap}>
              <Text style={[styles.topicName, { color: C.text }]}>{item.topic}</Text>
              <View style={[styles.topicTrack, { backgroundColor: C.border }]}>
                <View style={[styles.topicBar, { width: `${(item.count / maxCount) * 100}%` }]} />
              </View>
            </View>
            <Text style={[styles.topicCount, { color: Colors.primary }]}>{item.count}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.importBtn, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="download-outline" size={20} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.importTitle, { color: C.text }]}>Import Desktop Data</Text>
          <Text style={[styles.importDesc, { color: C.secondary }]}>Sync from Chrome extension</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.secondary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, alignItems: 'center',
  },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: Typography.fontSizes.xxl, fontWeight: '700' },
  statLabel: { fontSize: Typography.fontSizes.sm, marginTop: 2, textAlign: 'center' },
  statSub: { fontSize: Typography.fontSizes.xs, marginTop: 4, fontWeight: '600' },
  section: {
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: Typography.fontSizes.lg, fontWeight: '700', marginBottom: Spacing.md },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6 },
  barItem: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, marginTop: 4 },
  barValue: { fontSize: 10, fontWeight: '600' },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  topicRank: { width: 16, fontSize: Typography.fontSizes.sm, fontWeight: '700' },
  topicEmoji: { fontSize: 18, width: 24 },
  topicBarWrap: { flex: 1 },
  topicName: { fontSize: Typography.fontSizes.sm, fontWeight: '600', marginBottom: 4 },
  topicTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  topicBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  topicCount: { fontSize: Typography.fontSizes.md, fontWeight: '700', width: 30, textAlign: 'right' },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md,
  },
  importTitle: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
  importDesc: { fontSize: Typography.fontSizes.sm, marginTop: 2 },
});