import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, useColorScheme, Linking, Alert, Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { importFromText, exportData } from '../utils/importData';

function MenuItem({ icon, label, desc, onPress, isDark, danger }) {
  const C = isDark ? Colors.dark : Colors;
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderColor: C.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#fef2f2' : C.surface }]}>
        <Ionicons name={icon} size={18} color={danger ? '#dc2626' : Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: danger ? '#dc2626' : C.text }]}>{label}</Text>
        {desc && <Text style={[styles.menuDesc, { color: C.secondary }]}>{desc}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.secondary} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const handleImport = async () => {
    Alert.prompt(
      'Import from Extension',
      'Paste your JSON data from the Chrome extension export:',
      async (jsonText) => {
        if (!jsonText) return;
        const result = await importFromText(jsonText);
        if (result.success) {
          Alert.alert(
            '✅ Import Successful!',
            `${result.message}\n\nTopics: ${result.topics.join(', ')}\n\nKeywords: ${result.keywords.join(', ')}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Import Failed', result.message);
        }
      },
      'plain-text'
    );
  };

  const handleExport = async () => {
    const result = await exportData();
    if (result.success) {
      await Share.share({
        message: result.data,
        title: result.filename,
      });
    } else {
      Alert.alert('Export Failed', result.message);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.appHeader, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <View style={styles.appLogo}>
          <Text style={styles.logoEmoji}>🔒</Text>
        </View>
        <Text style={[styles.appName, { color: C.text }]}>My AI Curator</Text>
        <Text style={[styles.appVersion, { color: C.secondary }]}>Version 1.1.0</Text>
        <Text style={[styles.appTagline, { color: C.secondary }]}>
          Privacy-first social feed curation
        </Text>
      </View>

      <Text style={[styles.sectionHeader, { color: C.secondary }]}>FAVORITES</Text>
      <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <MenuItem
          icon="star-outline"
          label="Favorite Users & Posts"
          desc="View your saved users and posts"
          onPress={() => navigation.navigate('FavoriteUsers')}
          isDark={isDark}
        />
      </View>

      <Text style={[styles.sectionHeader, { color: C.secondary }]}>DATA</Text>
      <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <MenuItem
          icon="download-outline"
          label="Export My Data"
          desc="Share your topics & keywords as JSON"
          onPress={handleExport}
          isDark={isDark}
        />
        <MenuItem
          icon="qr-code-outline"
          label="Scan QR Code"
          desc="Sync from desktop in one scan"
          onPress={() => navigation.navigate('QRScan')}
          isDark={isDark}
        />
        <MenuItem
          icon="cloud-upload-outline"
          label="Import from Extension"
          desc="Sync data from Chrome extension JSON"
          onPress={() => navigation.navigate('Import')}
          isDark={isDark}
        />
      </View>

      <Text style={[styles.sectionHeader, { color: C.secondary }]}>COMMUNITY</Text>
      <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <MenuItem
          icon="document-text-outline"
          label="Take the Survey"
          desc="Help shape the roadmap"
          onPress={() => Linking.openURL('https://bit.ly/4woOLV7')}
          isDark={isDark}
        />
        <MenuItem
          icon="heart-outline"
          label="Support on Ko-fi"
          desc="Buy me a coffee ☕"
          onPress={() => Linking.openURL('https://ko-fi.com/mycurator')}
          isDark={isDark}
        />
        <MenuItem
          icon="logo-github"
          label="View on GitHub"
          onPress={() => Linking.openURL('https://github.com/etehero90-web/my-curator')}
          isDark={isDark}
        />
      </View>

      <Text style={[styles.sectionHeader, { color: C.secondary }]}>FOLLOW</Text>
      <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <MenuItem
          icon="share-social-outline"
          label="Bluesky"
          desc="@eno86.bsky.social"
          onPress={() => Linking.openURL('https://bsky.app/profile/eno86.bsky.social')}
          isDark={isDark}
        />
        <MenuItem
          icon="share-social-outline"
          label="X (Twitter)"
          desc="@mycurator86"
          onPress={() => Linking.openURL('https://x.com/mycurator86')}
          isDark={isDark}
        />
      </View>

      <Text style={[styles.sectionHeader, { color: C.secondary }]}>LEGAL</Text>
      <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <MenuItem
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          desc="We collect nothing. Zero."
          onPress={() => Linking.openURL('https://my-curator.vercel.app')}
          isDark={isDark}
        />
      </View>

      <Text style={[styles.footer, { color: C.secondary }]}>
        Made with 💚 · Privacy-first · Open Source
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  appHeader: {
    alignItems: 'center', padding: Spacing.xl,
    borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.md,
  },
  appLogo: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: Typography.fontSizes.xxl, fontWeight: '700' },
  appVersion: { fontSize: Typography.fontSizes.sm, marginTop: 4 },
  appTagline: { fontSize: Typography.fontSizes.sm, marginTop: 8, textAlign: 'center' },
  sectionHeader: {
    fontSize: Typography.fontSizes.xs, fontWeight: '700',
    letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md,
  },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderBottomWidth: 1,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
  menuDesc: { fontSize: Typography.fontSizes.sm, marginTop: 2 },
  footer: { textAlign: 'center', fontSize: Typography.fontSizes.sm, marginTop: Spacing.lg },
});