import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import FeaturedShowCard from '../components/FeaturedShowCard';
import ScreenContainer from '../components/ScreenContainer';
import SkeletonCard from '../components/SkeletonCard';
import { useFavorites } from '../context/FavoritesContext';
import { getTopPodcastsPage } from '../lib/api';

function trimPodcastPrefix(showTitle, rawTitle) {
  if (!rawTitle) return '';
  let next = String(rawTitle).trim();
  const normalizedShowTitle = (showTitle || '').trim();

  if (normalizedShowTitle) {
    const escaped = normalizedShowTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    next = next.replace(new RegExp(`^${escaped}\\s*[-:|]\\s*`, 'i'), '');
    next = next.replace(new RegExp(`^${escaped}\\s+`, 'i'), '');
  }

  return next.trim();
}

export default function GuideScreen({ navigation }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const { isFavorite, toggleFavorite } = useFavorites();

  const loadEpisodes = useCallback(async () => {
    setError('');
    try {
      const response = await getTopPodcastsPage(1, 30, category);
      const mapped = (response.podcasts || []).map((podcast, index) => {
        const id = String(podcast.id || `${podcast.title || 'pod'}-${index}`);
        return {
          id,
          title: podcast.title || 'Untitled Podcast',
          shortTitle: podcast.title || 'Untitled Podcast',
          host: podcast.author || '',
          query: podcast.title || podcast.author || '',
          image: podcast.image || '',
          latestEpisodes: Array.isArray(podcast.latest_episodes) ? podcast.latest_episodes : [],
          rank: podcast.rank || index + 1,
          category: podcast.category || 'All',
        };
      });
      setShows(mapped);
    } catch (e) {
      setError(e.message || 'Failed to load guide episodes.');
    }
  }, [category]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      await loadEpisodes();
      if (mounted) setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [loadEpisodes]);

  const filteredShows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shows;
    return shows.filter((show) =>
      show.title.toLowerCase().includes(q) || (show.host || '').toLowerCase().includes(q)
    );
  }, [query, shows]);

  async function onRefresh() {
    setRefreshing(true);
    await loadEpisodes();
    setRefreshing(false);
  }

  return (
    <ScreenContainer title="Guide" subtitle="TV guide view for featured shows">
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, category === 'all' && styles.filterChipActive]}
          onPress={() => setCategory('all')}
        >
          <Text style={styles.filterChipText}>All</Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, category === 'comedy' && styles.filterChipActive]}
          onPress={() => setCategory('comedy')}
        >
          <Text style={styles.filterChipText}>Comedy</Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, category === 'news' && styles.filterChipActive]}
          onPress={() => setCategory('news')}
        >
          <Text style={styles.filterChipText}>News</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search shows or hosts"
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredShows.map((show) => (
            <FeaturedShowCard
              key={show.id}
              show={show}
              favorite={isFavorite(`show:${show.id}`)}
              onToggleFavorite={() => toggleFavorite(`show:${show.id}`, {
                kind: 'show',
                id: show.id,
                title: show.title,
                query: show.query,
                author: show.host,
                image: show.image,
                logoUri: show.image,
              })}
              episodeTitle={trimPodcastPrefix(show.title, show.latestEpisodes?.[0]?.title)}
              onPress={() => navigation.navigate('Player', {
                showId: show.id,
                title: show.title,
                query: show.query,
                episodeUrl: show.latestEpisodes?.[0]?.url || '',
              })}
              onPlayPress={() => navigation.navigate('Player', {
                showId: show.id,
                title: show.title,
                query: show.query,
                episodeUrl: show.latestEpisodes?.[0]?.url || '',
              })}
            />
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 24 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: '#0b1328',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
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
