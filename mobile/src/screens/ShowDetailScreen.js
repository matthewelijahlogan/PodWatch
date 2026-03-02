import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { FEATURED_SHOW_MAP } from '../constants/featuredShows';
import { useFavorites } from '../context/FavoritesContext';
import { getLatestEpisodes, getTopEpisodes, toImageUrl } from '../lib/api';

export default function ShowDetailScreen({ route, navigation }) {
  const routeShow = route.params?.show || null;
  const staticShow = FEATURED_SHOW_MAP[route.params?.showId || 'jre'];
  const show = routeShow || staticShow;
  const [latest, setLatest] = useState(null);
  const [topEpisodes, setTopEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();

  async function load() {
    setError('');
    try {
      const searchQuery = show.query || show.title || show.host || '';
      const [latestEpisodes, top] = await Promise.all([
        getLatestEpisodes(searchQuery),
        getTopEpisodes(searchQuery),
      ]);
      setLatest(latestEpisodes[0] || null);
      setTopEpisodes(top.slice(0, 3));
    } catch (e) {
      setError(e.message || 'Failed to load show details.');
    }
  }

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
  }, [show.query, show.title, show.host]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScreenContainer title={show.shortTitle || show.title || 'Show Detail'} subtitle={show.host || show.author ? `Host: ${show.host || show.author}` : 'Live podcast details'}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#93c5fd" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <Pressable onPress={() => latest?.url && navigation.navigate('Player', { title: show.title, query: show.query || show.title, episodeUrl: latest.url })}>
            {show.poster ? (
              <Image source={show.poster} style={styles.poster} />
            ) : toImageUrl(show.image || show.logoUri) ? (
              <Image source={{ uri: toImageUrl(show.image || show.logoUri) }} style={styles.poster} />
            ) : (
              <View style={styles.posterFallback} />
            )}
          </Pressable>

          <View style={styles.titleRow}>
            <Text style={styles.showName}>{show.title || 'Untitled Podcast'}</Text>
            <Pressable
              style={[styles.fav, isFavorite(`show:${show.id || show.title}`) && styles.favActive]}
              onPress={() => toggleFavorite(`show:${show.id || show.title}`, {
                kind: 'show',
                id: show.id || show.title,
                title: show.title,
                query: show.query || show.title,
                author: show.host || show.author,
                image: show.image || show.logoUri,
                logoUri: show.logoUri || show.image,
              })}
            >
              <Text style={styles.favText}>{isFavorite(`show:${show.id || show.title}`) ? '\u2605' : '\u2606'}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.blockTitle}>Latest Episode</Text>
            <Text style={styles.episodeTitle}>{latest?.title || 'No episode available right now.'}</Text>
            {latest?.url ? (
              <Pressable
                style={styles.cta}
                onPress={() => navigation.navigate('Player', { title: show.title, query: show.query || show.title, episodeUrl: latest.url })}
              >
                <Text style={styles.ctaText}>Play In App</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.blockTitle}>Show Stats</Text>
            {(show.stats || [
              `Live rank: ${show.rank || 'N/A'}`,
              `Category: ${show.category || 'All'}`,
              `Source: Apple Podcast charts + YouTube full episodes`,
            ]).map((line) => (
              <Text key={line} style={styles.statLine}>{line}</Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.blockTitle}>Host Profile</Text>
            <Text style={styles.bio}>
              {show.bio || `${show.title || 'This podcast'} is loaded dynamically from top podcast charts and paired with the latest full episodes from YouTube.`}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.blockTitle}>Top Episodes</Text>
            {topEpisodes.length === 0 ? (
              <Text style={styles.bio}>No top episodes available.</Text>
            ) : (
              topEpisodes.map((episode) => (
                <Pressable
                  key={episode.url}
                  style={styles.linkRow}
                  onPress={() => navigation.navigate('Player', { title: show.title, query: show.query || show.title, episodeUrl: episode.url })}
                >
                  <Text numberOfLines={2} style={styles.linkText}>{episode.title}</Text>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 24 },
  poster: { width: '100%', height: 220, borderRadius: 14, marginBottom: 12 },
  posterFallback: { width: '100%', height: 220, borderRadius: 14, marginBottom: 12, backgroundColor: '#1e293b' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  showName: { fontSize: 20, fontWeight: '800', color: '#f8fafc', flex: 1, marginRight: 8 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 13,
    marginBottom: 12,
  },
  blockTitle: { color: '#f8fafc', fontWeight: '800', fontSize: 16, marginBottom: 8 },
  episodeTitle: { color: '#cbd5e1', marginBottom: 8 },
  cta: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  ctaText: { color: '#eff6ff', fontWeight: '700' },
  statLine: { color: '#cbd5e1', marginBottom: 4 },
  bio: { color: '#cbd5e1', lineHeight: 20 },
  linkRow: {
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    marginBottom: 8,
  },
  linkText: { color: '#dbeafe' },
  fav: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  favActive: { borderColor: '#60a5fa', backgroundColor: '#172554' },
  favText: { color: '#fbbf24', fontSize: 16 },
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
