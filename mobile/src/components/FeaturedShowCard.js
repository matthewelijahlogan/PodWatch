import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { toImageUrl } from '../lib/api';
import FavoriteButton from './FavoriteButton';

export default function FeaturedShowCard({ show, episodeTitle, onPress, onPlayPress, favorite = false, onToggleFavorite }) {
  const remoteLogo = toImageUrl(show.logoUri || show.logo_url || show.image);
  const imageSource = show.logo || (remoteLogo ? { uri: remoteLogo } : null);
  const displayTitle = show.shortTitle || show.title || 'Untitled Show';
  const displayHost = show.host || show.author || '';

  function onOpenYouTube(event) {
    if (event?.stopPropagation) event.stopPropagation();
    if (onPlayPress) {
      onPlayPress();
      return;
    }
    Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(show.query)}`);
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {imageSource ? <Image source={imageSource} style={styles.logo} /> : <View style={styles.logoFallback} />}
      <View style={styles.body}>
        <Text style={styles.title}>{displayTitle}</Text>
        {displayHost ? <Text style={styles.host}>{displayHost}</Text> : null}
        <Text numberOfLines={2} style={styles.episode}>
          {episodeTitle || 'No recent episode available'}
        </Text>
      </View>
      <View style={styles.actions}>
        {onToggleFavorite ? <FavoriteButton active={favorite} onPress={onToggleFavorite} /> : null}
        <Pressable style={styles.button} onPress={onOpenYouTube}>
          <Text style={styles.buttonText}>Play</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  logoFallback: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  host: {
    color: '#93c5fd',
    fontSize: 12,
    marginTop: 2,
  },
  episode: {
    marginTop: 6,
    color: '#cbd5e1',
    fontSize: 12,
  },
  actions: {
    gap: 8,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
