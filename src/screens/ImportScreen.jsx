import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, useColorScheme, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { importFromText } from '../utils/importData';

export default function ImportScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!jsonText.trim()) {
      Alert.alert('Error', 'Please paste your JSON data first');
      return;
    }
    setLoading(true);
    const result = await importFromText(jsonText.trim());
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '✅ Import Successful!',
        `${result.message}\n\nTopics: ${result.topics.join(', ')}\n\nKeywords: ${result.keywords.join(', ')}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Import Failed', result.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: C.background, borderColor: C.border }]}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
          <Text style={[styles.backText, { color: C.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Import Data</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 안내 */}
        <View style={[styles.infoCard, { backgroundColor: C.cardBg, borderColor: C.border }]}>
          <Text style={[styles.infoTitle, { color: C.text }]}>How to import</Text>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: Colors.primary }]}>1</Text>
            <Text style={[styles.stepText, { color: C.text }]}>Open My AI Curator on desktop</Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: Colors.primary }]}>2</Text>
            <Text style={[styles.stepText, { color: C.text }]}>Settings → Export preferences (JSON)</Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: Colors.primary }]}>3</Text>
            <Text style={[styles.stepText, { color: C.text }]}>Open the JSON file and copy all text</Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: Colors.primary }]}>4</Text>
            <Text style={[styles.stepText, { color: C.text }]}>Paste it in the box below</Text>
          </View>
        </View>

        {/* 텍스트 입력 */}
        <Text style={[styles.label, { color: C.secondary }]}>PASTE JSON DATA</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: C.cardBg, borderColor: C.border, color: C.text }]}
          multiline
          numberOfLines={10}
          placeholder='Paste your JSON here...\n\n{\n  "selectedTopics": [...],\n  "customKeywords": [...]\n}'
          placeholderTextColor={C.secondary}
          value={jsonText}
          onChangeText={setJsonText}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {jsonText.length > 0 && (
          <Text style={[styles.charCount, { color: C.secondary }]}>
            {jsonText.length} characters
          </Text>
        )}

        {/* 버튼 */}
        <TouchableOpacity
          style={[styles.importBtn, { opacity: loading || !jsonText.trim() ? 0.5 : 1 }]}
          onPress={handleImport}
          disabled={loading || !jsonText.trim()}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.importBtnText}>
            {loading ? 'Importing...' : 'Import Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearBtn, { borderColor: C.border }]}
          onPress={() => setJsonText('')}
        >
          <Text style={[styles.clearBtnText, { color: C.secondary }]}>Clear</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, paddingTop: 50,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 },
  backText: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
  headerTitle: { fontSize: Typography.fontSizes.lg, fontWeight: '700' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  infoCard: {
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  infoTitle: { fontSize: Typography.fontSizes.md, fontWeight: '700', marginBottom: Spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    color: '#fff', fontSize: Typography.fontSizes.sm,
    fontWeight: '700', textAlign: 'center', lineHeight: 24,
  },
  stepText: { fontSize: Typography.fontSizes.sm, flex: 1 },
  label: {
    fontSize: Typography.fontSizes.xs, fontWeight: '700',
    letterSpacing: 1, marginBottom: Spacing.sm,
  },
  textArea: {
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, fontSize: Typography.fontSizes.sm,
    minHeight: 180, textAlignVertical: 'top',
    marginBottom: Spacing.sm,
  },
  charCount: { fontSize: Typography.fontSizes.xs, textAlign: 'right', marginBottom: Spacing.md },
  importBtn: {
    backgroundColor: Colors.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, padding: Spacing.md,
    borderRadius: BorderRadius.full, marginBottom: Spacing.sm,
  },
  importBtnText: { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: '700' },
  clearBtn: {
    borderWidth: 1, padding: Spacing.md,
    borderRadius: BorderRadius.full, alignItems: 'center',
  },
  clearBtnText: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
});