import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, useColorScheme, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { storage } from '../utils/storage';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function FavoriteUsersScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const [activeTab, setActiveTab] = useState('users');
  const [favorites, setFavorites] = useState([]);
  const [favoritePosts, setFavoritePosts] = useState([]);

  useEffect(() => {
    (async () => {
      const savedUsers = await storage.get('favorite_users') || [];
      const savedPosts = await storage.get('favorite_posts') || [];
      setFavorites(savedUsers);
      setFavoritePosts(savedPosts);
    })();
  }, []);

  const removeUser = async (handle) => {
    Alert.alert(
      'Remove Favorite',
      `Remove ${handle} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            const next = favorites.filter(u => u.handle !== handle);
            setFavorites(next);
            await storage.set('favorite_users', next);
          }
        }
      ]
    );
  };

  const removePost = async (uri) => {
    Alert.alert(
      'Remove Post',
      'Remove this post from favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            const next = favoritePosts.filter(p => p.uri !== uri);
            setFavoritePosts(next);
            await storage.set('favorite_posts', next);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* 탭 */}
      <View style={[styles.tabRow, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons name="star" size={16} color={activeTab === 'users' ? Colors.primary : C.secondary} />
          <Text style={[styles.tabText, { color: activeTab === 'users' ? Colors.primary : C.secondary }]}>
            Users {favorites.length > 0 && `(${favorites.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons name="bookmark" size={16} color={activeTab === 'posts' ? Colors.primary : C.secondary} />
          <Text style={[styles.tabText, { color: activeTab === 'posts' ? Colors.primary : C.secondary }]}>
            Posts {favoritePosts.length > 0 && `(${favoritePosts.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 유저 탭 */}
      {activeTab === 'users' && (
        favorites.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No favorite users yet</Text>
            <Text style={[styles.emptyDesc, { color: C.secondary }]}>
              Tap the star icon on any profile to add them
            </Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.handle}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.userCard, { backgroundColor: C.cardBg, borderColor: C.border }]}
                onPress={() => navigation.navigate('UserProfile', { handle: item.handle })}
              >
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.avatarText}>{item.displayName?.[0] || '?'}</Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={[styles.displayName, { color: C.text }]}>
                    {item.displayName || item.handle}
                  </Text>
                  <Text style={[styles.handle, { color: C.secondary }]}>@{item.handle}</Text>
                </View>
                <TouchableOpacity onPress={() => removeUser(item.handle)} style={styles.removeBtn}>
                  <Ionicons name="star" size={22} color="#f59e0b" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {/* 포스트 탭 */}
      {activeTab === 'posts' && (
        favoritePosts.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🔖</Text>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No favorite posts yet</Text>
            <Text style={[styles.emptyDesc, { color: C.secondary }]}>
              Tap the bookmark icon on any post to save it
            </Text>
          </View>
        ) : (
          <FlatList
            data={favoritePosts}
            keyExtractor={(item) => item.uri}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.postCard, { backgroundColor: C.cardBg, borderColor: C.border }]}
                onPress={() => navigation.navigate('PostDetail', {
                  post: {
                    uri: item.uri,
                    author: {
                      handle: item.authorHandle,
                      displayName: item.authorName,
                      avatar: item.authorAvatar,
                    },
                    record: { text: item.text, createdAt: item.indexedAt },
                    likeCount: item.likeCount,
                    repostCount: item.repostCount,
                    indexedAt: item.indexedAt,
                  }
                })}
              >
                <View style={styles.postAuthorRow}>
                  {item.authorAvatar ? (
                    <Image source={{ uri: item.authorAvatar }} style={styles.postAvatar} />
                  ) : (
                    <View style={[styles.postAvatarPlaceholder, { backgroundColor: Colors.primary }]}>
                      <Text style={styles.postAvatarText}>{item.authorName?.[0] || '?'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.postAuthorName, { color: C.text }]}>
                      {item.authorName || item.authorHandle}
                    </Text>
                    <Text style={[styles.postAuthorHandle, { color: C.secondary }]}>
                      @{item.authorHandle} · {timeAgo(item.indexedAt)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removePost(item.uri)} style={styles.removeBtn}>
                    <Ionicons name="bookmark" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.postText, { color: C.text }]} numberOfLines={3}>
                  {item.text}
                </Text>
                <View style={styles.postStats}>
                  <Text style={[styles.postStat, { color: C.secondary }]}>♥ {item.likeCount || 0}</Text>
                  <Text style={[styles.postStat, { color: C.secondary }]}>↻ {item.repostCount || 0}</Text>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
  list: { padding: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.fontSizes.xl, fontWeight: '700', marginBottom: Spacing.sm },
  emptyDesc: { fontSize: Typography.fontSizes.md, textAlign: 'center', lineHeight: 22 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  userInfo: { flex: 1 },
  displayName: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
  handle: { fontSize: Typography.fontSizes.sm, marginTop: 2 },
  removeBtn: { padding: Spacing.sm },
  postCard: {
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postAvatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  postAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  postAuthorName: { fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  postAuthorHandle: { fontSize: Typography.fontSizes.xs, marginTop: 1 },
  postText: { fontSize: Typography.fontSizes.md, lineHeight: 22, marginBottom: Spacing.sm },
  postStats: { flexDirection: 'row', gap: Spacing.md },
  postStat: { fontSize: Typography.fontSizes.sm },
});