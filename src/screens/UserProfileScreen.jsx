import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, useColorScheme, ActivityIndicator, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { storage } from '../utils/storage';

async function fetchUserProfile(handle) {
  try {
    const res = await fetch(`https://api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`);
    return await res.json();
  } catch (e) { return null; }
}

async function fetchUserPosts(handle) {
  try {
    const res = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=10`);
    const data = await res.json();
    return data.feed?.map(f => f.post) || [];
  } catch (e) { return []; }
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function UserProfileScreen({ route, navigation }) {
  const { handle, platform } = route.params;
  const isMasto = platform === 'mastodon' || handle?.includes('@');
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    (async () => {
      const [prof, userPosts, favorites] = await Promise.all([
        fetchUserProfile(handle),
        fetchUserPosts(handle),
        storage.get('favorite_users'),
      ]);
      setProfile(prof);
      setPosts(userPosts);
      setIsFavorite((favorites || []).some(u => u.handle === handle));
      setLoading(false);
    })();
  }, [handle]);

  const toggleFavorite = async () => {
    const favorites = await storage.get('favorite_users') || [];
    let next;
    if (isFavorite) {
      next = favorites.filter(u => u.handle !== handle);
      Alert.alert('Removed', `${profile?.displayName || handle} removed from favorites`);
    } else {
      next = [...favorites, {
        handle: profile?.handle,
        displayName: profile?.displayName,
        avatar: profile?.avatar,
        did: profile?.did,
      }];
      Alert.alert('Added! ⭐', `${profile?.displayName || handle} added to favorites!`);
    }
    await storage.set('favorite_users', next);
    setIsFavorite(!isFavorite);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: C.background, borderColor: C.border }]}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
          <Text style={[styles.backText, { color: C.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: C.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 헤더 */}
        <View style={[styles.profileHeader, { backgroundColor: C.cardBg, borderColor: C.border }]}>
          {profile?.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
              <Text style={styles.avatarText}>{profile?.displayName?.[0] || '?'}</Text>
            </View>
          )}
          <Text style={[styles.displayName, { color: C.text }]}>
            {profile?.displayName || handle}
          </Text>
          <Text style={[styles.handle, { color: C.secondary }]}>@{handle}</Text>

          {profile?.description ? (
            <Text style={[styles.bio, { color: C.text }]}>{profile.description}</Text>
          ) : null}

          {/* 팔로워/팔로잉 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: C.text }]}>
                {profile?.followersCount?.toLocaleString() || 0}
              </Text>
              <Text style={[styles.statLabel, { color: C.secondary }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: C.text }]}>
                {profile?.followsCount?.toLocaleString() || 0}
              </Text>
              <Text style={[styles.statLabel, { color: C.secondary }]}>Following</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: C.text }]}>
                {profile?.postsCount?.toLocaleString() || 0}
              </Text>
              <Text style={[styles.statLabel, { color: C.secondary }]}>Posts</Text>
            </View>
          </View>

          {/* 버튼들 */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.favoriteBtn, {
                backgroundColor: isFavorite ? '#fef3c7' : Colors.primary,
                borderColor: isFavorite ? '#f59e0b' : Colors.primary,
              }]}
              onPress={toggleFavorite}
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={18}
                color={isFavorite ? '#f59e0b' : '#fff'}
              />
              <Text style={[styles.favoriteBtnText, { color: isFavorite ? '#f59e0b' : '#fff' }]}>
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bskyBtn, { borderColor: C.border }]}
              onPress={() => Linking.openURL(
                isMasto
                  ? `https://mastodon.social/@${handle}`
                  : `https://bsky.app/profile/${handle}`
              )}
            >
              <Text style={styles.bskyBtnText}>
                {isMasto ? '🐘 Mastodon' : '🦋 Bluesky'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 최근 포스트 */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Posts</Text>
        {posts.map((post, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.postCard, { backgroundColor: C.cardBg, borderColor: C.border }]}
            onPress={() => navigation.navigate('PostDetail', { post })}
          >
            <Text style={[styles.postText, { color: C.text }]} numberOfLines={4}>
              {post.record?.text || ''}
            </Text>
            <Text style={[styles.postTime, { color: C.secondary }]}>
              {timeAgo(post.indexedAt)}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, paddingTop: 50,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 },
  backText: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
  headerTitle: { fontSize: Typography.fontSizes.lg, fontWeight: '700' },
  container: { flex: 1 },
  profileHeader: {
    alignItems: 'center', padding: Spacing.lg,
    borderBottomWidth: 1, marginBottom: Spacing.md,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: Spacing.sm },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 28 },
  displayName: { fontSize: Typography.fontSizes.xl, fontWeight: '700' },
  handle: { fontSize: Typography.fontSizes.sm, marginTop: 4, marginBottom: Spacing.sm },
  bio: { fontSize: Typography.fontSizes.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  statItem: { alignItems: 'center', paddingHorizontal: Spacing.lg },
  statNum: { fontSize: Typography.fontSizes.lg, fontWeight: '700' },
  statLabel: { fontSize: Typography.fontSizes.xs, marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  btnRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  favoriteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5,
  },
  favoriteBtnText: { fontSize: Typography.fontSizes.sm, fontWeight: '700' },
  bskyBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  bskyBtnText: { fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg, fontWeight: '700',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  postCard: {
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  postText: { fontSize: Typography.fontSizes.md, lineHeight: 22, marginBottom: Spacing.sm },
  postTime: { fontSize: Typography.fontSizes.sm },
});