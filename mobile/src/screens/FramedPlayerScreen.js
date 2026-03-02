import React, { useEffect } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { WebView } from 'react-native-webview';

const FRAME_IMAGE = require('../../assets/images/podwatchFrame.png');

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

export default function FramedPlayerScreen({ route, navigation }) {
  const sourceUrl = route.params?.episodeUrl || '';
  const query = route.params?.query || '';
  const title = route.params?.title || 'Now Playing';

  const videoId = extractYouTubeVideoId(sourceUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(query || title)}`;

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <ImageBackground source={FRAME_IMAGE} resizeMode="cover" style={styles.frame}>
        <View style={styles.videoShell}>
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

        <Pressable style={styles.close} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Exit Full Screen</Text>
        </Pressable>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  frame: {
    flex: 1,
  },
  videoShell: {
    position: 'absolute',
    left: '9%',
    right: '9%',
    top: '16%',
    bottom: '23%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#0f172a',
    overflow: 'hidden',
    backgroundColor: '#000',
    zIndex: 2,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderWidth: 1,
    borderColor: '#64748b',
    zIndex: 2,
  },
  closeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
});
