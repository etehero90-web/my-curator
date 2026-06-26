import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, useColorScheme, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { storage } from '../utils/storage';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailScreen({ route, navigation }) {
  const { post } = route.params;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const author = post.author;
  const text = post.record?.text || '';
  const images = post.embed?.images || [];
  const isMasto = post.platform === 'mastodon';
  const url = isMasto
    ? (post.originalUrl || `https://mastodon.social/@${author?.handle}`)
    : `https://bsky.app/profile/${author?.handle}/post/${post.uri?.split('/').pop()}`;
  const videoPlaylist = post.embed?.video?.playlist || post.embed?.playlist;
  const player = useVideoPlayer(videoPlaylist || '', p => { p.loop = false; });

  const [isFavoriteUser, setIsFavoriteUser] = useState(false);
  const [isFavoritePost, setIsFavoritePost] = useState(false);

  useEffect(() => {
    (async () => {
      const favoriteUsers = await storage.get('favorite_users') || [];
      const favoritePosts = await storage.get('favorite_posts') || [];
      setIsFavoriteUser(favoriteUsers.some(u => u.handle === author?.handle));
      setIsFavoritePost(favoritePosts.some(p => p.uri === post.uri));
    })();
  }, []);

  const toggleFavoriteUser = async () => {
    const favorites = await storage.get('favorite_users') || [];
    let next;
    if (isFavoriteUser) {
      next = favorites.filter(u => u.handle !== author?.handle);
    } else {
      next = [...favorites, {
        handle: author?.handle,
        displayName: author?.displayName,
        avatar: author?.avatar,
        did: author?.did,
      }];
      Alert.alert('Added!', `${author?.displayName || author?.handle} added to favorites!`);
    }
    await storage.set('favorite_users', next);
    setIsFavoriteUser(!isFavoriteUser);
  };

  const toggleFavoritePost = async () => {
    const favoritePosts = await storage.get('favorite_posts') || [];
    let next;
    if (isFavoritePost) {
      next = favoritePosts.filter(p => p.uri !== post.uri);
      Alert.alert('Removed', 'Post removed from favorites');
    } else {
      next = [...favoritePosts, {
        uri: post.uri,
        text: post.record?.text || '',
        authorHandle: author?.handle,
        authorName: author?.displayName,
        authorAvatar: author?.avatar,
        likeCount: post.likeCount,
        repostCount: post.repostCount,
        indexedAt: post.indexedAt,
      }];
      Alert.alert('Saved! ⭐', 'Post added to favorites!');
    }
    await storage.set('favorite_posts', next);
    setIsFavoritePost(!isFavoritePost);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: C.background, borderColor: C.border }]}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
          <Text style={[styles.backText, { color: C.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Post</Text>
        {/* 포스트 즐겨찾기 버튼 */}
        <TouchableOpacity onPress={toggleFavoritePost} style={styles.favPostBtn}>
          <Ionicons
            name={isFavoritePost ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isFavoritePost ? Colors.primary : C.secondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: C.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 작성자 정보 */}
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => navigation.navigate('UserProfile', { handle: author?.handle, platform: post.platform })}
        >
          {author?.avatar ? (
            <Image source={{ uri: author.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
              <Text style={styles.avatarText}>{author?.displayName?.[0] || '?'}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={[styles.displayName, { color: C.text }]}>
              {author?.displayName || author?.handle}
            </Text>
            <Text style={[styles.handle, { color: C.secondary }]}>
              @{author?.handle} · {timeAgo(post.indexedAt)}
            </Text>
          </View>
          {/* 사용자 즐겨찾기 버튼 */}
          <TouchableOpacity onPress={toggleFavoriteUser} style={styles.favoriteBtn}>
            <Ionicons
              name={isFavoriteUser ? 'star' : 'star-outline'}
              size={24}
              color={isFavoriteUser ? '#f59e0b' : C.secondary}
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* 포스트 내용 */}
        <View style={[styles.postCard, { backgroundColor: C.cardBg, borderColor: C.border }]}>
          <Text style={[styles.postText, { color: C.text }]}>{text}</Text>
          {images.length > 0 && (
            <View style={styles.imagesWrap}>
              {images.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: img.fullsize || img.thumb }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
          {videoPlaylist && (
            <VideoView
              player={player}
              style={styles.videoView}
              nativeControls={true}
              fullscreenOptions={{ supportedOrientations: 'landscape' }}
            />
          )}
        </View>

        {/* 통계 */}
        <View style={[styles.statsRow, { backgroundColor: C.cardBg, borderColor: C.border }]}>
          <View style={styles.stat}>
            <Ionicons name="heart" size={18} color="#ef4444" />
            <Text style={[styles.statText, { color: C.text }]}>{post.likeCount ?? 0} likes</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="repeat" size={18} color={Colors.primary} />
            <Text style={[styles.statText, { color: C.text }]}>{post.repostCount ?? 0} reposts</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble" size={18} color={C.secondary} />
            <Text style={[styles.statText, { color: C.text }]}>{post.replyCount ?? 0} replies</Text>
          </View>
        </View>

        {/* 액션 버튼 */}
        <TouchableOpacity
          style={[styles.openBtn, { borderColor: Colors.primary }]}
          onPress={() => Linking.openURL(url)}
        >
          <Ionicons name="open-outline" size={18} color={Colors.primary} />
          <Text style={[styles.openBtnText, { color: Colors.primary }]}>
            {isMasto ? 'Open in Mastodon' : 'Open in Bluesky'}
          </Text>
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
  favPostBtn: { width: 40, alignItems: 'flex-end' },
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  authorRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.md, gap: Spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  authorInfo: { flex: 1 },
  displayName: { fontSize: Typography.fontSizes.lg, fontWeight: '700' },
  handle: { fontSize: Typography.fontSizes.sm, marginTop: 2 },
  favoriteBtn: { padding: Spacing.sm },
  postCard: {
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  postText: { fontSize: Typography.fontSizes.md, lineHeight: 24 },
  imagesWrap: { marginTop: Spacing.md, gap: Spacing.sm },
  postImage: { width: '100%', height: 200, borderRadius: BorderRadius.md },
  videoView: { width: '100%', height: 220, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderWidth: 1.5,
    borderRadius: BorderRadius.full, padding: Spacing.md,
  },
  openBtnText: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
});