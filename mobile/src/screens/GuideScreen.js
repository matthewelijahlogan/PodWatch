import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import FeaturedShowCard from '../components/FeaturedShowCard';
import ScreenContainer from '../components/ScreenContainer';
import SkeletonCard from '../components/SkeletonCard';
import { useFavorites } from '../context/FavoritesContext';
import { getGuide } from '../lib/api';
import { COLORS, FONTS } from '../theme/tokens';

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
      const response = await getGuide(category, 5);
      const mapped = response.channels.map((channel, index) => {
        const podcast = channel.show || {};
        const id = String(podcast.id || `${podcast.title || 'pod'}-${index}`);
        return {
          id,
          title: podcast.title || 'Untitled Podcast',
          shortTitle: podcast.short_title || podcast.title || 'Untitled Podcast',
          host: podcast.host || '',
          query: podcast.youtube_query || podcast.title || '',
          image: channel.episodes?.[0]?.thumbnail || '',
          latestEpisodes: Array.isArray(channel.episodes) ? channel.episodes : [],
          rank: podcast.rank || index + 1,
          category: podcast.category || 'All',
        };
      });
      setShows(mapped);
      if (response.partial) {
        setError('Some channels are temporarily unavailable; cached guide data is shown where possible.');
      }
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
        placeholderTextColor="#8d8d8d"
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
            (() => {
              const firstUrl = show.latestEpisodes?.[0]?.url || '';
              return (
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
                    episodeUrl: firstUrl,
                  })}
                  onPlayPress={firstUrl ? () => navigation.navigate('Player', {
                    showId: show.id,
                    title: show.title,
                    query: show.query,
                    episodeUrl: firstUrl,
                  }) : undefined}
                />
              );
            })()
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
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: COLORS.red,
    backgroundColor: '#230b0f',
  },
  filterChipText: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  search: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#0f0f0f',
    color: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontFamily: FONTS.body,
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
