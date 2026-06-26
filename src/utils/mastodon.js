// 마스토돈 핸들에서 username과 instance 추출
export function parseMastodonHandle(handle) {
  const cleaned = handle.replace(/^@/, '').trim();
  if (cleaned.includes('@')) {
    const parts = cleaned.split('@');
    return { username: parts[0], instance: parts[1] };
  }
  return { username: cleaned, instance: 'mastodon.social' };
}

// 마스토돈 계정 정보 가져오기
export async function fetchMastodonProfile(handle) {
  try {
    const { username, instance } = parseMastodonHandle(handle);
    const res = await fetch(`https://${instance}/api/v1/accounts/lookup?acct=${username}`);
    if (!res.ok) throw new Error(`Account not found (${res.status})`);
    return await res.json();
  } catch (e) {
    console.log('Mastodon profile error:', e.message);
    return null;
  }
}

// 마스토돈 피드 가져오기
export async function fetchMastodonFeed(handle, limit = 20) {
  try {
    const { username, instance } = parseMastodonHandle(handle);

    // 계정 ID 조회
    const lookupRes = await fetch(`https://${instance}/api/v1/accounts/lookup?acct=${username}`);
    if (!lookupRes.ok) throw new Error(`Account not found (${lookupRes.status})`);
    const account = await lookupRes.json();

    // 포스트 가져오기
    const statusRes = await fetch(
      `https://${instance}/api/v1/accounts/${account.id}/statuses?limit=${limit}&exclude_replies=true`
    );
    if (!statusRes.ok) throw new Error(`Could not fetch statuses (${statusRes.status})`);
    const statuses = await statusRes.json();

    // 포맷 통일 (블루스카이 포맷과 동일하게)
    return statuses.map(s => ({
      platform: 'mastodon',
      cid: s.id,
      uri: s.id,
      indexedAt: s.created_at,
      author: {
        did: account.id,
        handle: `${account.username}@${instance}`,
        displayName: account.display_name || account.username,
        avatar: account.avatar,
      },
      record: {
        text: stripHtml(s.content),
        createdAt: s.created_at,
      },
      likeCount: s.favourites_count || 0,
      repostCount: s.reblogs_count || 0,
      replyCount: s.replies_count || 0,
      instance,
      originalUrl: s.url,
    }));
  } catch (e) {
    console.log('Mastodon feed error:', e.message);
    return [];
  }
}

// 마스토돈 키워드 검색
export async function searchMastodonPosts(keyword, instance = 'mastodon.social', limit = 10) {
  try {
    // 공개 타임라인에서 해시태그로 검색
    const tag = keyword.replace(/\s+/g, '').toLowerCase();
    const url = `https://${instance}/api/v1/timelines/tag/${encodeURIComponent(tag)}?limit=${limit}`;
    console.log('Mastodon tag URL:', url);
    const res = await fetch(url);
    console.log('Mastodon tag status:', res.status);
    if (!res.ok) return [];
    const statuses = await res.json();
    console.log('Mastodon results:', statuses?.length);
    return (statuses || []).map(s => ({
      platform: 'mastodon',
      cid: s.id,
      uri: s.id,
      indexedAt: s.created_at,
      author: {
        did: s.account.id,
        handle: `${s.account.username}@${instance}`,
        displayName: s.account.display_name || s.account.username,
        avatar: s.account.avatar,
      },
      record: {
        text: stripHtml(s.content),
        createdAt: s.created_at,
      },
      likeCount: s.favourites_count || 0,
      repostCount: s.reblogs_count || 0,
      replyCount: s.replies_count || 0,
      instance,
      originalUrl: s.url,
    }));
  } catch (e) {
    console.log('Mastodon search error:', e.message);
    return [];
  }
}

// HTML 태그 제거
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}