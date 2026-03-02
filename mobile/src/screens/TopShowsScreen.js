import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import SkeletonCard from '../components/SkeletonCard';
import { useFavorites } from '../context/FavoritesContext';
import { getTopPodcastsPage, toImageUrl } from '../lib/api';

export default function TopShowsScreen({ navigation }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await getTopPodcastsPage(1, 12, 'all');
      const mapped = (response.podcasts || []).map((podcast, index) => ({
        id: String(podcast.id || `${podcast.title}-${index}`),
        title: podcast.title || 'Untitled Podcast',
        author: podcast.author || '',
        image: podcast.image || '',
        latestEpisode: Array.isArray(podcast.latest_episodes) ? podcast.latest_episodes[0] : null,
      }));
      setShows(mapped);
    } catch (e) {
      setError(e.message || 'Failed to load top shows.');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      await load();
      if (mounted) setLoading(false);
    }
    init();
    return () => {
      mounted = false;
    };
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScreenContainer title="Top Shows" subtitle="Live ranked podcasts with latest full episodes">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={shows}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const imageUrl = toImageUrl(item.image);
            return (
              <View style={styles.slide}>
                <Pressable
                  onPress={() => navigation.navigate('ShowDetail', {
                    show: item,
                  })}
                >
                  {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.poster} /> : <View style={styles.posterFallback} />}
                </Pressable>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Pressable
                    style={[styles.fav, isFavorite(`show:${item.id}`) && styles.favActive]}
                    onPress={() => toggleFavorite(`show:${item.id}`, {
                      kind: 'show',
                      id: item.id,
                      title: item.title,
                      query: item.title,
                      author: item.author,
                      image: item.image,
                      logoUri: item.image,
                    })}
                  >
                    <Text style={styles.favText}>{isFavorite(`show:${item.id}`) ? '\u2605' : '\u2606'}</Text>
                  </Pressable>
                </View>
                <Text numberOfLines={3} style={styles.episode}>{item.latestEpisode?.title || 'No recent episode found'}</Text>
                {item.latestEpisode?.url ? (
                  <Pressable
                    style={styles.button}
                    onPress={() => navigation.navigate('Player', {
                      title: item.title,
                      query: item.title,
                      episodeUrl: item.latestEpisode.url,
                    })}
                  >
                    <Text style={styles.buttonText}>Play Latest Episode</Text>
                  </Pressable>
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
  slide: {
    width: 330,
    marginRight: 10,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  poster: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  posterFallback: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  titleRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: 17,
    color: '#f8fafc',
    flex: 1,
    marginRight: 8,
  },
  episode: {
    marginTop: 8,
    color: '#cbd5e1',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#eff6ff',
    fontWeight: '700',
  },
  fav: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1328',
  },
  favActive: { borderColor: '#60a5fa', backgroundColor: '#172554' },
  favText: { color: '#fbbf24' },
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
