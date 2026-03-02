import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { toImageUrl } from '../lib/api';
import FavoriteButton from './FavoriteButton';

export default function PodcastCard({ podcast, episodes = [], favorite = false, onToggleFavorite, onOpenAudio }) {
  const imageUrl = toImageUrl(podcast.image);

  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        <View style={styles.leftCol}>
          <Text numberOfLines={2} style={styles.title}>{podcast.title || 'Untitled Podcast'}</Text>
          {podcast.author ? <Text numberOfLines={1} style={styles.author}>{podcast.author}</Text> : null}
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={styles.imageFallback} />}
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.rightHeading}>Latest Full Episodes</Text>
          {episodes.length > 0 ? (
            episodes.slice(0, 3).map((episode) => (
              <Pressable
                key={`${podcast.title}-${episode.url}`}
                style={styles.episodeRow}
                onPress={() => Linking.openURL(episode.url)}
              >
                <Text numberOfLines={2} style={styles.episodeText}>{episode.title}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.noEpisodes}>No recent episodes available.</Text>
          )}
        </View>
        <View style={styles.favoriteWrap}>
          {onToggleFavorite ? <FavoriteButton active={favorite} onPress={onToggleFavorite} /> : null}
        </View>
      </View>

      <View style={styles.actions}>
        {onOpenAudio ? (
          <Pressable style={styles.audioButton} onPress={onOpenAudio}>
            <Text style={styles.audioButtonText}>Episodes + Audio</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftCol: { width: 120 },
  rightCol: { flex: 1, marginLeft: 10 },
  favoriteWrap: { marginLeft: 8 },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    marginTop: 8,
  },
  imageFallback: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    marginTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  author: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 12,
  },
  rightHeading: { color: '#93c5fd', fontWeight: '700', fontSize: 12, marginBottom: 6 },
  actions: { marginTop: 10, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  audioButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  audioButtonText: { color: '#eff6ff', fontWeight: '700', fontSize: 12, letterSpacing: 0.2 },
  episodeRow: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginBottom: 7,
  },
  episodeText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  noEpisodes: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
  },
});
