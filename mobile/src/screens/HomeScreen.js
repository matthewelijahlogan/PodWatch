import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { getEditorsPicks, getHealth, getTopPodcastsPage } from '../lib/api';

const QUICK_LINKS = [
  { label: 'Open Guide', route: 'Guide', accent: '#38bdf8' },
  { label: 'Discover Top 30', route: 'Discover', accent: '#818cf8' },
  { label: 'Top Shows', route: 'TopShows', accent: '#22c55e' },
];

const LIVE_STATS = [
  { label: 'Live Chart Rows', value: '30 x Category' },
  { label: 'Episode Slots', value: '3 / Podcast' },
  { label: 'Watch Mode', value: 'In-App + Frame' },
];

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({
    chartRows: 'Loading...',
    episodeSlots: '3 / Podcast',
    watchMode: 'In-App + Frame',
    health: 'Checking...',
    topOne: 'Loading...',
  });

  useEffect(() => {
    let mounted = true;
    async function loadLiveStats() {
      try {
        const [health, top, picks] = await Promise.all([
          getHealth(),
          getTopPodcastsPage(1, 30, 'all'),
          getEditorsPicks(),
        ]);
        if (!mounted) return;
        setStats({
          chartRows: `${top.total || top.podcasts.length || 30} Live`,
          episodeSlots: '3 / Podcast',
          watchMode: 'In-App + Frame',
          health: health?.status || 'unknown',
          topOne: top.podcasts?.[0]?.title || picks?.[0]?.title || 'Unavailable',
        });
      } catch {
        if (!mounted) return;
        setStats((prev) => ({
          ...prev,
          chartRows: 'Fallback cache',
          health: 'degraded',
          topOne: 'Unavailable',
        }));
      }
    }
    loadLiveStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScreenContainer title="PodWatch" subtitle="Live podcast intelligence, mobile first">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Image source={require('../../assets/images/logo.png')} style={styles.heroLogo} />
          <Text style={styles.heroTitle}>PodWatch Command Deck</Text>
          <Text style={styles.heroText}>
            Track top shows, review episodes, and watch full podcasts with a cleaner in-app player pipeline.
          </Text>
          <Text style={styles.heroText}>
            The app now pulls chart data and episode titles dynamically so your listings stay current.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Launch</Text>
          <View style={styles.quickGrid}>
            {QUICK_LINKS.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => navigation.navigate(item.route)}
                style={[styles.quickCard, { borderColor: item.accent }]}
              >
                <Text style={styles.quickLabel}>{item.label}</Text>
                <Text style={styles.quickHint}>Jump now</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Pipeline</Text>
          <View style={styles.statsWrap}>
            {LIVE_STATS.map((item) => {
              const value = item.label === 'Live Chart Rows'
                ? stats.chartRows
                : item.label === 'Episode Slots'
                  ? stats.episodeSlots
                  : stats.watchMode;
              return (
              <View key={item.label} style={styles.statCard}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
              );
            })}
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.topOne}</Text>
              <Text style={styles.statLabel}>Current #1 Podcast</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.health}</Text>
              <Text style={styles.statLabel}>Backend Health</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How To Use</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipLine}>1. Pick a show in Guide and hit Play.</Text>
            <Text style={styles.tipLine}>2. Use Full Screen Frame for immersive viewing.</Text>
            <Text style={styles.tipLine}>3. Rate episodes and leave comments in Audio Episodes.</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#0b1328',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    color: '#eff6ff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroText: {
    color: '#bfdbfe',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#111827',
  },
  quickLabel: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 13,
  },
  quickHint: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 11,
  },
  statsWrap: {
    gap: 8,
  },
  statCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
  },
  statValue: {
    color: '#93c5fd',
    fontWeight: '800',
    fontSize: 16,
  },
  statLabel: {
    marginTop: 4,
    color: '#94a3b8',
    fontSize: 12,
  },
  tipCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    gap: 6,
  },
  tipLine: {
    color: '#dbeafe',
    fontSize: 13,
  },
});
