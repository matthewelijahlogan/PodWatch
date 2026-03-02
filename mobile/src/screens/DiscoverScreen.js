import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import PodcastCard from '../components/PodcastCard';
import ScreenContainer from '../components/ScreenContainer';
import SegmentedControl from '../components/SegmentedControl';
import SkeletonCard from '../components/SkeletonCard';
import { useFavorites } from '../context/FavoritesContext';
import { getCategories, getEditorsPicks, getRecommendations, getTopPodcastsPage } from '../lib/api';

const TABS = [
  { label: 'Top', value: 'top' },
  { label: 'Editors', value: 'editors' },
  { label: 'Categories', value: 'categories' },
  { label: 'Recommended', value: 'recommend' },
  { label: 'New', value: 'new' },
];

const PAGE_SIZE = 30;

export default function DiscoverScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('top');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [topPodcasts, setTopPodcasts] = useState([]);
  const [topPage, setTopPage] = useState(1);
  const [topTotal, setTopTotal] = useState(0);

  const [editorsPicks, setEditorsPicks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [episodesByTitle, setEpisodesByTitle] = useState({});
  const { isFavorite, toggleFavorite } = useFavorites();

  const hasMoreTop = topPodcasts.length < topTotal;

  const loadStaticData = useCallback(async () => {
    const [picks, cats, recs] = await Promise.all([
      getEditorsPicks(),
      getCategories(),
      getRecommendations(),
    ]);
    setEditorsPicks(picks);
    setCategories(cats);
    setRecommendations(recs);
  }, []);

  const loadTopPage = useCallback(async (page, append, category) => {
    const resp = await getTopPodcastsPage(page, PAGE_SIZE, category || 'all');
    setTopPage(resp.page);
    setTopTotal(resp.total);
    let source = resp.podcasts || [];
    setTopPodcasts((prev) => {
      const merged = append ? [...prev, ...resp.podcasts] : resp.podcasts;
      source = merged;
      return merged;
    });

    const entries = source.map((pod) => [pod.title, Array.isArray(pod.latest_episodes) ? pod.latest_episodes : []]);
    setEpisodesByTitle(Object.fromEntries(entries));
  }, []);

  const loadData = useCallback(async () => {
    setError('');
    await Promise.all([loadStaticData(), loadTopPage(1, false, selectedCategory)]);
  }, [loadStaticData, loadTopPage, selectedCategory]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        await loadData();
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load discover data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [loadData]);

  const content = useMemo(() => {
    const base = activeTab === 'top'
      ? topPodcasts
      : activeTab === 'editors'
        ? editorsPicks
      : activeTab === 'categories'
          ? categories
          : activeTab === 'recommend'
            ? recommendations
            : topPodcasts;

    const normalized = query.trim().toLowerCase();
    if (!normalized) return base;

    return base.filter((item) => {
      const haystack = `${item.name || ''} ${item.title || ''} ${item.author || ''} ${item.description || ''}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [activeTab, categories, editorsPicks, query, recommendations, topPodcasts]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {
      setError(e.message || 'Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  }

  async function onLoadMore() {
    if (!(activeTab === 'top' || activeTab === 'new')) return;
    if (loadingMore || !hasMoreTop) return;

    setLoadingMore(true);
    try {
      await loadTopPage(topPage + 1, true, selectedCategory);
    } catch (e) {
      setError(e.message || 'Failed to load more podcasts.');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <ScreenContainer title="Discover" subtitle="Categories, picks, recommendations, and fresh episodes">
      <SegmentedControl value={activeTab} options={TABS} onChange={setActiveTab} />
      <TextInput
        style={styles.search}
        placeholder="Search current section"
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
      />

      {error ? (
        <Pressable onPress={onRefresh} style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Tap to retry</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item, index) => `${item.id || item.name || item.title}-${index}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#0f172a" /> : null}
          ListEmptyComponent={<Text style={styles.empty}>No results for your search.</Text>}
          renderItem={({ item }) => {
            if (activeTab === 'categories') {
              return (
                <Pressable
                  style={[styles.categoryCard, selectedCategory === (item.id || '').toLowerCase() && styles.categoryCardActive]}
                  onPress={async () => {
                    const nextCategory = (item.id || 'all').toLowerCase();
                    setSelectedCategory(nextCategory);
                    setLoading(true);
                    try {
                      await loadTopPage(1, false, nextCategory);
                    } catch (e) {
                      setError(e.message || 'Failed to load selected category.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <Text style={styles.categoryDesc}>Tap to load Top 30 in this category</Text>
                </Pressable>
              );
            }

            const episodes = episodesByTitle[item.title] || [];
            return (
              <PodcastCard
                podcast={item}
                episodes={episodes}
                onOpenAudio={() => navigation.navigate('PodcastEpisodes', { title: item.title })}
                favorite={isFavorite(`pod:${item.title}`)}
                onToggleFavorite={() => toggleFavorite(`pod:${item.title}`, {
                  kind: 'podcast',
                  id: item.id,
                  title: item.title,
                  author: item.author,
                  image: item.image,
                })}
              />
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 24 },
  search: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0b1328',
    color: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  categoryCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  categoryCardActive: { borderColor: '#38bdf8' },
  categoryName: { color: '#e2e8f0', fontWeight: '800', fontSize: 15 },
  categoryDesc: { color: '#94a3b8', marginTop: 4 },
  empty: { textAlign: 'center', color: '#94a3b8', paddingTop: 20 },
  footerLoader: { marginTop: 8, marginBottom: 20 },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: '#450a0a',
    padding: 10,
    marginBottom: 8,
  },
  errorText: { color: '#fecaca', fontWeight: '700' },
  errorHint: { color: '#fca5a5', marginTop: 4, fontSize: 12 },
});
