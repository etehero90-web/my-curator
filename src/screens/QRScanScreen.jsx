import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export default function QRScanScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={[styles.header, { backgroundColor: C.background, borderColor: C.border }]}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
          <Text style={[styles.backText, { color: C.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Scan QR Code</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.center}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={[styles.title, { color: C.text }]}>Coming Soon</Text>
        <Text style={[styles.desc, { color: C.secondary }]}>
          QR Code scanning will be available{'\n'}after the Play Store release.
        </Text>
        <Text style={[styles.desc2, { color: C.secondary }]}>
          For now, use Import from Extension{'\n'}to sync your data.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: { fontSize: Typography.fontSizes.xl, fontWeight: '700', marginBottom: Spacing.sm },
  desc: { fontSize: Typography.fontSizes.md, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.sm },
  desc2: { fontSize: Typography.fontSizes.sm, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl, opacity: 0.7 },
  btn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: Typography.fontSizes.md },
});