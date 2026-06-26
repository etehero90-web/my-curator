import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, useColorScheme,
  Image, TextInput, Modal
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { storage, KEYS } from '../utils/storage';
import { PRESET_TOPICS } from '../constants/topics';
import { searchMastodonPosts } from '../utils/mastodon';

async function fetchBlueskyKeywordFeed(keywords = []) {
  const posts = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(kw)}&limit=10`);
      const data = await res.json();
      if (data.posts) posts.push(...data.posts.map(p => ({ ...p, platform: 'bluesky' })));
    } catch (e) {}
  }
  const seen = new Set();
  return posts.filter(p => { if (seen.has(p.cid)) return false; seen.add(p.cid); return true; })
    .sort((a, b) => new Date(b.indexedAt) - new Date(a.indexedAt)).slice(0, 40);
}

async function fetchBlueskyUserFeed(handle) {
  const res = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=30`);
  const data = await res.json();
  if (data.error) throw new Error(data.message || 'Account not found');
  return (data.feed || []).map(item => ({ ...item.post, platform: 'bluesky', embed: item.post.embed }));
}

async function fetchMastodonUserFeed(handle) {
  const cleaned = handle.replace(/^@/, '');
  const parts = cleaned.split('@');
  const username = parts[0];
  const instance = parts[1] || 'mastodon.social';
  const lookupRes = await fetch(`https://${instance}/api/v1/accounts/lookup?acct=${username}`);
  if (!lookupRes.ok) throw new Error('Account not found');
  const account = await lookupRes.json();
  const statusRes = await fetch(`https://${instance}/api/v1/accounts/${account.id}/statuses?limit=30&exclude_replies=true`);
  const statuses = await statusRes.json();
  return statuses.map(s => ({
    platform: 'mastodon', cid: s.id, uri: s.id, indexedAt: s.created_at,
    author: { did: account.id, handle: `${account.username}@${instance}`, displayName: account.display_name || account.username, avatar: account.avatar },
    record: { text: s.content.replace(/<[^>]+>/g, '').trim(), createdAt: s.created_at },
    likeCount: s.favourites_count || 0, repostCount: s.reblogs_count || 0, replyCount: s.replies_count || 0, originalUrl: s.url,
  }));
}

async function fetchMastodonKeywordFeed(keywords = [], instance = 'mastodon.social') {
  const posts = [];
  for (const kw of keywords.slice(0, 2)) {
    try { posts.push(...await searchMastodonPosts(kw, instance, 8)); } catch (e) {}
  }
  const seen = new Set();
  return posts.filter(p => { if (seen.has(p.cid)) return false; seen.add(p.cid); return true; }).slice(0, 20);
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function VideoModal({ playlist, visible, onClose }) {
  const player = useVideoPlayer(visible ? (playlist || '') : '', p => {
    if (visible && playlist) {
      p.loop = false;
    }
  });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {playlist && visible && (
            <VideoView
              player={player}
              style={styles.modalVideo}
              nativeControls={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function VideoCard({ C, thumbnail, playlist }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.videoThumbWrap}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.videoThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.videoThumb, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="film-outline" size={40} color="#666" />
          </View>
        )}
        <View style={styles.videoPlayOverlay}>
          <View style={styles.videoPlayBtn}>
            <Ionicons name="play" size={28} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
      <VideoModal
        playlist={playlist}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

function PostCard({ post, isDark, onPress }) {
  const C = isDark ? Colors.dark : Colors;
  const author = post.author;
  const text = post.record?.text || '';
  const isMasto = post.platform === 'mastodon';
  const images = post.embed?.images || post.embed?.media?.images || [];
  const external = post.embed?.external;
  const hasVideo = !!(post.embed?.video || post.embed?.$type?.includes('video'));

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.border },
        isMasto && { borderLeftWidth: 3, borderLeftColor: '#6364ff' }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        {author?.avatar
          ? <Image source={{ uri: author.avatar }} style={styles.avatar} />
          : <View style={[styles.avatarPlaceholder, { backgroundColor: isMasto ? '#6364ff' : Colors.primary }]}>
              <Text style={styles.avatarText}>{author?.displayName?.[0] || '?'}</Text>
            </View>
        }
        <View style={styles.authorInfo}>
          <Text style={[styles.displayName, { color: C.text }]} numberOfLines={1}>
            {author?.displayName || author?.handle}
          </Text>
          <Text style={[styles.handle, { color: C.secondary }]}>
            @{author?.handle} · {timeAgo(post.indexedAt)}
          </Text>
        </View>
        <View style={[styles.sourceBadge, { backgroundColor: isMasto ? '#f0f0ff' : '#e8f4f0' }]}>
          <Text style={{ fontSize: 16 }}>{isMasto ? '🐘' : '🦋'}</Text>
        </View>
      </View>

      {text.length > 0 && (
        <Text style={[styles.postText, { color: C.text }]} numberOfLines={5}>{text}</Text>
      )}

      {images.length > 0 && (
        <View style={[styles.imageGrid, images.length === 1 && { flexDirection: 'column' }]}>
          {images.slice(0, 4).map((img, i) => (
            <Image key={i} source={{ uri: img.fullsize || img.thumb }}
              style={[styles.postImage, images.length === 1 ? styles.imageSingle : styles.imageMulti]}
              resizeMode="cover" />
          ))}
        </View>
      )}

      {external && !images.length && (
        <View style={[styles.externalCard, { borderColor: C.border, backgroundColor: C.surface }]}>
          {external.thumb && <Image source={{ uri: external.thumb }} style={styles.externalThumb} resizeMode="cover" />}
          <View style={{ flex: 1, padding: 8 }}>
            <Text style={[styles.externalTitle, { color: C.text }]} numberOfLines={1}>{external.title || external.uri}</Text>
            {external.description && <Text style={[styles.externalDesc, { color: C.secondary }]} numberOfLines={2}>{external.description}</Text>}
          </View>
        </View>
      )}

      {hasVideo && (
        <VideoCard
          C={C}
          thumbnail={post.embed?.video?.thumbnail || post.embed?.thumbnail}
          playlist={post.embed?.video?.playlist || post.embed?.playlist}
        />
      )}

      <View style={styles.cardFooter}>
        <View style={styles.stat}>
          <Ionicons name="heart-outline" size={14} color={C.secondary} />
          <Text style={[styles.statText, { color: C.secondary }]}>{post.likeCount ?? 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="repeat-outline" size={14} color={C.secondary} />
          <Text style={[styles.statText, { color: C.secondary }]}>{post.repostCount ?? 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={14} color={C.secondary} />
          <Text style={[styles.statText, { color: C.secondary }]}>{post.replyCount ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation, savedState, onSaveState }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const [posts, setPosts] = useState(savedState?.posts || []);
  const [loading, setLoading] = useState(!savedState);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(savedState?.searchQuery || '');
  const [searchMode, setSearchMode] = useState(savedState?.searchMode || 'keyword');
  const [activeFilter, setActiveFilter] = useState(savedState?.activeFilter || 'all');
  const [error, setError] = useState('');
  const [prevState, setPrevState] = useState(null);

  useEffect(() => {
    if (!savedState) {
      setLoading(true);
      loadFeed('', 'keyword').finally(() => setLoading(false));
    }
  }, []);

  const loadFeed = async (query, mode) => {
    setError('');
    try {
      if (query && mode === 'bluesky') {
        const handle = query.includes('.') ? query : `${query}.bsky.social`;
        const result = await fetchBlueskyUserFeed(handle);
        setPosts(result);
        return;
      }
      if (query && mode === 'mastodon') {
        const handle = query.includes('@') ? query : `${query}@mastodon.social`;
        const result = await fetchMastodonUserFeed(handle);
        setPosts(result);
        return;
      }
      const kws = query ? [query] : await (async () => {
        const saved = await storage.get(KEYS.SELECTED_TOPICS) || ['tech', 'privacy'];
        const custom = await storage.get(KEYS.CUSTOM_KEYWORDS) || [];
        const presetKws = PRESET_TOPICS.filter(t => saved.includes(t.id)).flatMap(t => t.keywords.slice(0, 1));
        return [...new Set([...presetKws, ...custom])];
      })();
      const mastoHandle = await storage.get(KEYS.MASTODON_HANDLE);
      let mastoInstance = 'mastodon.social';
      if (mastoHandle?.includes('@')) {
        const parts = mastoHandle.replace(/^@/, '').split('@');
        if (parts[1]) mastoInstance = parts[1];
      }
      const [bsky, masto] = await Promise.all([
        fetchBlueskyKeywordFeed(kws),
        fetchMastodonKeywordFeed(kws, mastoInstance),
      ]);
      setPosts([...bsky, ...masto].sort((a, b) => new Date(b.indexedAt) - new Date(a.indexedAt)));
    } catch (e) {
      setError(e.message || 'Failed to load feed');
      setPosts([]);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    await loadFeed(searchQuery.trim(), searchMode);
    setLoading(false);
  };

  const handleModeChange = (mode) => {
    if (mode !== searchMode) {
      setPrevState({ posts, searchQuery, searchMode, activeFilter });
    }
    setSearchMode(mode);
    setSearchQuery('');
    setPosts([]);
    if (mode === 'keyword') {
      setLoading(true);
      loadFeed('', 'keyword').finally(() => setLoading(false));
    }
  };

  const handleBack = () => {
    if (prevState) {
      setPosts(prevState.posts);
      setSearchQuery(prevState.searchQuery);
      setSearchMode(prevState.searchMode);
      setActiveFilter(prevState.activeFilter);
      setPrevState(null);
    } else {
      setSearchQuery('');
      setSearchMode('keyword');
      setPosts([]);
      setLoading(true);
      loadFeed('', 'keyword').finally(() => setLoading(false));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed(searchQuery.trim(), searchMode);
    setRefreshing(false);
  };

  const filteredPosts = activeFilter === 'all' ? posts : posts.filter(p => p.platform === activeFilter);
  const bskyCount = posts.filter(p => p.platform === 'bluesky').length;
  const mastoCount = posts.filter(p => p.platform === 'mastodon').length;

  const placeholder = searchMode === 'bluesky' ? 'Bluesky username...'
    : searchMode === 'mastodon' ? 'user@instance.social...'
    : 'Search topics...';

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>

      {/* 뒤로가기 바 */}
      {(prevState || (searchQuery && posts.length > 0 && searchMode !== 'keyword')) && (
        <TouchableOpacity
          style={[styles.backBar, { backgroundColor: C.cardBg, borderColor: C.border }]}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={16} color={Colors.primary} />
          <Text style={[styles.backBarText, { color: Colors.primary }]}>
            {prevState
              ? `Back to ${prevState.searchQuery ? `"${prevState.searchQuery}"` : 'Feed'}`
              : 'Back to Feed'}
          </Text>
          {searchQuery && posts.length > 0 && (
            <Text style={[styles.backBarCurrent, { color: C.secondary }]} numberOfLines={1}>
              {searchMode === 'bluesky' ? '🦋' : '🐘'} {searchQuery}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* 모드 탭 */}
      <View style={[styles.modeRow, { backgroundColor: C.cardBg, borderColor: C.border }]}>
        {[
          { key: 'keyword', label: 'Topics' },
          { key: 'bluesky', label: 'Bluesky' },
          { key: 'mastodon', label: 'Mastodon' },
        ].map(m => (
          <TouchableOpacity key={m.key}
            style={[styles.modeTab, searchMode === m.key && styles.modeTabActive]}
            onPress={() => handleModeChange(m.key)}>
            <Text style={[styles.modeTabText, { color: searchMode === m.key ? Colors.primary : C.secondary }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 검색바 */}
      <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="search" size={16} color={C.secondary} />
        <TextInput
          style={[styles.searchInput, { color: C.text }]}
          placeholder={placeholder}
          placeholderTextColor={C.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={C.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>Go</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 힌트 */}
      {searchMode === 'bluesky' && (
        <Text style={[styles.hint, { color: C.secondary }]}>Auto adds .bsky.social if no domain</Text>
      )}
      {searchMode === 'mastodon' && (
        <Text style={[styles.hint, { color: C.secondary }]}>Auto adds @mastodon.social if no instance</Text>
      )}

      {/* 필터 탭 */}
      {!loading && posts.length > 0 && searchMode === 'keyword' && (
        <View style={[styles.filterRow, { borderColor: C.border }]}>
          {[
            { key: 'all', label: `All (${posts.length})` },
            { key: 'bluesky', label: `🦋 (${bskyCount})` },
            { key: 'mastodon', label: `🐘 (${mastoCount})` },
          ].map(f => (
            <TouchableOpacity key={f.key}
              style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(f.key)}>
              <Text style={[styles.filterText, { color: activeFilter === f.key ? Colors.primary : C.secondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 피드 */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: C.secondary }]}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={[styles.emptyTitle, { color: C.text }]}>Not found</Text>
          <Text style={[styles.emptyDesc, { color: C.secondary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleSearch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: C.text }]}>No posts found</Text>
          <Text style={[styles.emptyDesc, { color: C.secondary }]}>
            {searchMode === 'keyword' ? 'Try adjusting your topics in Settings' : 'Enter a username and tap Go'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={item => `${item.platform}-${item.cid || item.uri}`}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isDark={isDark}
              onPress={() => {
                if (onSaveState) onSaveState({ posts, searchQuery, searchMode, activeFilter });
                navigation.navigate('PostDetail', { post: item });
              }}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1,
  },
  backBarText: { fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  backBarCurrent: { flex: 1, fontSize: Typography.fontSizes.sm, textAlign: 'right' },
  modeRow: { flexDirection: 'row', borderBottomWidth: 1 },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modeTabActive: { borderBottomColor: Colors.primary },
  modeTabText: { fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: Spacing.md, marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: BorderRadius.full, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSizes.md, padding: 0 },
  searchBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.fontSizes.sm },
  hint: { fontSize: Typography.fontSizes.xs, textAlign: 'center', marginBottom: Spacing.sm },
  filterRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: Spacing.md },
  filterTab: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: Colors.primary },
  filterText: { fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: Spacing.sm },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  authorInfo: { flex: 1 },
  displayName: { fontSize: Typography.fontSizes.md, fontWeight: '600' },
  handle: { fontSize: Typography.fontSizes.sm, marginTop: 1 },
  sourceBadge: { padding: 6, borderRadius: BorderRadius.full },
  postText: { fontSize: Typography.fontSizes.md, lineHeight: 22, marginBottom: Spacing.sm },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: Spacing.sm, borderRadius: BorderRadius.md, overflow: 'hidden' },
  postImage: { borderRadius: BorderRadius.sm },
  imageSingle: { width: '100%', height: 200 },
  imageMulti: { width: '48%', height: 140 },
  externalCard: { flexDirection: 'row', borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  externalThumb: { width: 72, height: 72 },
  externalTitle: { fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  externalDesc: { fontSize: Typography.fontSizes.xs, marginTop: 2 },
  videoThumbWrap: { position: 'relative', marginBottom: Spacing.sm, borderRadius: BorderRadius.md, overflow: 'hidden' },
  videoThumb: { width: '100%', height: 200, borderRadius: BorderRadius.md },
  videoPlayOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  videoPlayBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '100%', aspectRatio: 16/9, position: 'relative' },
  modalClose: { position: 'absolute', top: -44, right: 8, zIndex: 10, padding: 8 },
  modalVideo: { width: '100%', height: '100%' },
  cardFooter: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: Typography.fontSizes.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { marginTop: Spacing.md, fontSize: Typography.fontSizes.md },
  emptyTitle: { fontSize: Typography.fontSizes.xl, fontWeight: '700', marginBottom: Spacing.sm },
  emptyDesc: { fontSize: Typography.fontSizes.md, textAlign: 'center', marginBottom: Spacing.lg },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  retryText: { color: '#fff', fontWeight: '700', fontSize: Typography.fontSizes.md },
});