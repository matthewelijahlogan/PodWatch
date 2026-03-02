import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import SkeletonCard from '../components/SkeletonCard';
import {
  getPodcastEpisodes,
  getReviewSummaries,
  getReviewSummary,
  submitReview,
} from '../lib/api';

const DOWNLOADS_KEY = 'podwatch_audio_downloads_v1';

function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80);
}

function StarSelector({ value, onChange, size = 20 }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} style={styles.starTap}>
          <Text style={[styles.star, value >= star && styles.starActive, { fontSize: size }]}>{'\u2605'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function PodcastEpisodesScreen({ route }) {
  const title = route.params?.title || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [downloads, setDownloads] = useState({});
  const [busyUrl, setBusyUrl] = useState('');

  const [podcastSummary, setPodcastSummary] = useState({ average_rating: 0, review_count: 0, comments: [] });
  const [episodeSummaries, setEpisodeSummaries] = useState({});
  const [podcastRating, setPodcastRating] = useState(0);
  const [submittingPodcast, setSubmittingPodcast] = useState(false);

  const [activeEpisodeId, setActiveEpisodeId] = useState('');
  const [episodeRating, setEpisodeRating] = useState(0);
  const [episodeComment, setEpisodeComment] = useState('');
  const [episodeAuthor, setEpisodeAuthor] = useState('');
  const [submittingEpisodeId, setSubmittingEpisodeId] = useState('');

  useEffect(() => {
    loadEpisodes();
    loadDownloads();
  }, [title]);

  const podcastTargetId = useMemo(() => {
    if (podcast?.title) return podcast.title;
    return title;
  }, [podcast, title]);

  async function loadEpisodes() {
    setLoading(true);
    setError('');
    try {
      const data = await getPodcastEpisodes(title, 20);
      setPodcast(data.podcast);
      setEpisodes(data.episodes);

      const resolvedPodcastId = data.podcast?.title || title;
      const episodeIds = data.episodes.map((ep) => ep.audio_url).filter(Boolean);

      const [podSummary, epSummaries] = await Promise.all([
        getReviewSummary('podcast', resolvedPodcastId),
        getReviewSummaries('episode', episodeIds),
      ]);

      setPodcastSummary(podSummary || { average_rating: 0, review_count: 0, comments: [] });
      setEpisodeSummaries(epSummaries || {});
    } catch (e) {
      setError(e.message || 'Failed to load episodes.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDownloads() {
    try {
      const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (raw) setDownloads(JSON.parse(raw));
    } catch {
      // ignore
    }
  }

  async function persistDownloads(next) {
    setDownloads(next);
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next));
  }

  async function onDownload(ep) {
    if (!ep.audio_url) return;

    try {
      setBusyUrl(ep.audio_url);
      const dir = `${FileSystem.documentDirectory}podwatch-audio/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const file = sanitizeFileName(`${title}_${ep.title}`) + '.mp3';
      const target = `${dir}${file}`;
      await FileSystem.downloadAsync(ep.audio_url, target);

      const next = { ...downloads, [ep.audio_url]: target };
      await persistDownloads(next);
      Alert.alert('Downloaded', 'Episode saved to app storage.');
    } catch (e) {
      Alert.alert('Download failed', e.message || 'Unable to download this file.');
    } finally {
      setBusyUrl('');
    }
  }

  async function onOpenFile(ep) {
    const localUri = downloads[ep.audio_url];
    if (!localUri) return;

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(localUri);
    } else {
      Alert.alert('Unavailable', 'File sharing is not available on this device.');
    }
  }

  async function onSubmitPodcastReview() {
    if (!podcastTargetId) return;
    if (!podcastRating) {
      Alert.alert('Rating required', 'Select a star rating from 1 to 5.');
      return;
    }

    try {
      setSubmittingPodcast(true);
      const result = await submitReview({
        kind: 'podcast',
        target_id: podcastTargetId,
        target_title: podcastTargetId,
        rating: podcastRating,
      });
      if (result?.summary) {
        setPodcastSummary(result.summary);
      }
      setPodcastRating(0);
      Alert.alert('Thanks', 'Podcast rating submitted.');
    } catch (e) {
      Alert.alert('Review failed', e.message || 'Unable to submit podcast review.');
    } finally {
      setSubmittingPodcast(false);
    }
  }

  async function onSubmitEpisodeReview(ep) {
    if (!ep?.audio_url) return;
    if (!episodeRating) {
      Alert.alert('Rating required', 'Select a star rating from 1 to 5.');
      return;
    }

    try {
      setSubmittingEpisodeId(ep.audio_url);
      const result = await submitReview({
        kind: 'episode',
        target_id: ep.audio_url,
        target_title: ep.title,
        rating: episodeRating,
        comment: episodeComment,
        author: episodeAuthor,
      });

      if (result?.summary) {
        setEpisodeSummaries((prev) => ({ ...prev, [ep.audio_url]: result.summary }));
      }

      setEpisodeRating(0);
      setEpisodeComment('');
      setEpisodeAuthor('');
      setActiveEpisodeId('');
      Alert.alert('Thanks', 'Episode review submitted.');
    } catch (e) {
      Alert.alert('Review failed', e.message || 'Unable to submit episode review.');
    } finally {
      setSubmittingEpisodeId('');
    }
  }

  const headerText = useMemo(() => {
    if (podcast?.title) return podcast.title;
    return title;
  }, [podcast, title]);

  return (
    <ScreenContainer title="Audio Episodes" subtitle={headerText}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Podcast Rating</Text>
        <Text style={styles.reviewMeta}>
          {podcastSummary.review_count || 0} ratings | Avg {Number(podcastSummary.average_rating || 0).toFixed(2)} / 5
        </Text>
        <StarSelector value={podcastRating} onChange={setPodcastRating} size={23} />
        <Pressable
          style={[styles.reviewSubmit, (!podcastRating || submittingPodcast) && styles.disabled]}
          disabled={!podcastRating || submittingPodcast}
          onPress={onSubmitPodcastReview}
        >
          <Text style={styles.reviewSubmitText}>{submittingPodcast ? 'Submitting...' : 'Submit Podcast Rating'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item, index) => `${item.audio_url}-${index}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No audio episodes found for this podcast.</Text>}
          renderItem={({ item }) => {
            const downloaded = Boolean(downloads[item.audio_url]);
            const busy = busyUrl === item.audio_url;
            const summary = episodeSummaries[item.audio_url] || { average_rating: 0, review_count: 0, comments: [] };
            const showReviewForm = activeEpisodeId === item.audio_url;

            return (
              <View style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.published || 'Unknown publish date'} {item.duration ? `| ${item.duration}` : ''}
                </Text>

                <Text style={styles.reviewMeta}>
                  Episode ratings: {summary.review_count || 0} | Avg {Number(summary.average_rating || 0).toFixed(2)} / 5
                </Text>

                <View style={styles.actions}>
                  <Pressable style={[styles.btn, styles.stream]} onPress={() => Linking.openURL(item.audio_url)}>
                    <Text style={styles.btnText}>Stream</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.btn, styles.download, busy && styles.disabled]}
                    onPress={() => onDownload(item)}
                    disabled={busy}
                  >
                    <Text style={styles.btnText}>{busy ? 'Downloading...' : downloaded ? 'Redownload' : 'Download'}</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.btn, styles.reviewBtn]}
                    onPress={() => {
                      if (showReviewForm) {
                        setActiveEpisodeId('');
                        return;
                      }
                      setActiveEpisodeId(item.audio_url);
                    }}
                  >
                    <Text style={styles.btnText}>{showReviewForm ? 'Close Review' : 'Rate + Comment'}</Text>
                  </Pressable>

                  {downloaded ? (
                    <Pressable style={[styles.btn, styles.open]} onPress={() => onOpenFile(item)}>
                      <Text style={styles.btnText}>Share File</Text>
                    </Pressable>
                  ) : null}
                </View>

                {showReviewForm ? (
                  <View style={styles.episodeReviewForm}>
                    <StarSelector value={episodeRating} onChange={setEpisodeRating} />
                    <TextInput
                      style={styles.input}
                      value={episodeAuthor}
                      onChangeText={setEpisodeAuthor}
                      placeholder="Name (optional)"
                      placeholderTextColor="#94a3b8"
                      maxLength={40}
                    />
                    <TextInput
                      style={[styles.input, styles.commentInput]}
                      value={episodeComment}
                      onChangeText={setEpisodeComment}
                      placeholder="Comment on this episode"
                      placeholderTextColor="#94a3b8"
                      multiline
                      maxLength={600}
                    />
                    <Pressable
                      style={[styles.reviewSubmit, (!episodeRating || submittingEpisodeId === item.audio_url) && styles.disabled]}
                      disabled={!episodeRating || submittingEpisodeId === item.audio_url}
                      onPress={() => onSubmitEpisodeReview(item)}
                    >
                      <Text style={styles.reviewSubmitText}>
                        {submittingEpisodeId === item.audio_url ? 'Submitting...' : 'Submit Episode Review'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {summary.comments?.length > 0 ? (
                  <View style={styles.commentsWrap}>
                    {summary.comments.slice(0, 2).map((comment, index) => (
                      <View key={`${item.audio_url}-comment-${index}`} style={styles.commentCard}>
                        <Text style={styles.commentHead}>
                          {(comment.author || 'Anonymous').trim()} | {comment.rating}/5
                        </Text>
                        <Text style={styles.commentText}>{comment.comment}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  reviewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 10,
  },
  reviewTitle: { color: '#f8fafc', fontWeight: '800', fontSize: 16 },
  reviewMeta: { color: '#93c5fd', marginTop: 4, marginBottom: 8, fontSize: 12 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  starTap: { paddingVertical: 2, paddingRight: 2 },
  star: { color: '#475569' },
  starActive: { color: '#fbbf24' },
  reviewSubmit: {
    marginTop: 6,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewSubmitText: { color: '#eff6ff', fontWeight: '700', fontSize: 12 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 10,
  },
  title: { color: '#f8fafc', fontWeight: '700', fontSize: 15 },
  meta: { color: '#94a3b8', marginTop: 4, marginBottom: 6, fontSize: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { borderRadius: 9, paddingVertical: 8, paddingHorizontal: 10 },
  stream: { backgroundColor: '#334155' },
  download: { backgroundColor: '#1d4ed8' },
  reviewBtn: { backgroundColor: '#0ea5e9' },
  open: { backgroundColor: '#059669' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  episodeReviewForm: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#020617',
    color: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  commentInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  commentsWrap: { marginTop: 10, gap: 8 },
  commentCard: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 8,
  },
  commentHead: { color: '#bfdbfe', fontSize: 12, fontWeight: '700', marginBottom: 3 },
  commentText: { color: '#e2e8f0', fontSize: 12 },
  disabled: { opacity: 0.6 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },
  error: {
    color: '#fecaca',
    backgroundColor: '#450a0a',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
});
