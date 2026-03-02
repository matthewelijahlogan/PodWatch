import React, { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ScreenContainer from '../components/ScreenContainer';

function extractYouTubeVideoId(url) {
  if (!url) return null;
  const value = String(url);

  const watchMatch = value.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = value.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const embedMatch = value.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

export default function PlayerScreen({ route, navigation }) {
  const title = route.params?.title || 'PodWatch Player';
  const sourceUrl = route.params?.episodeUrl || '';
  const query = route.params?.query || '';

  const embedUrl = useMemo(() => {
    const id = extractYouTubeVideoId(sourceUrl);
    if (id) {
      return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
    }
    if (query) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    }
    return '';
  }, [query, sourceUrl]);

  const canOpenExternal = !!sourceUrl || !!query;
  const externalUrl = sourceUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  return (
    <ScreenContainer title="Player" subtitle={title}>
      {embedUrl ? (
        <View style={styles.playerFrame}>
          <WebView
            source={{ uri: embedUrl }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
          />
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No playable video found for this show yet.</Text>
        </View>
      )}

      {canOpenExternal ? (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.button, styles.fullscreenButton]}
            onPress={() => navigation.navigate('FramedPlayer', { title, episodeUrl: sourceUrl, query })}
          >
            <Text style={styles.buttonText}>Full Screen Frame</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => Linking.openURL(externalUrl)}>
            <Text style={styles.buttonText}>Open in YouTube</Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  playerFrame: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#020617',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0b1328',
    padding: 14,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  actionRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  fullscreenButton: {
    backgroundColor: '#0ea5e9',
  },
  buttonText: {
    color: '#eff6ff',
    fontWeight: '700',
    fontSize: 13,
  },
});
