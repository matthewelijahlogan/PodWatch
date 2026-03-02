import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import PodcastCard from '../components/PodcastCard';
import FeaturedShowCard from '../components/FeaturedShowCard';
import ScreenContainer from '../components/ScreenContainer';
import { FEATURED_SHOWS } from '../constants/featuredShows';
import { useFavorites } from '../context/FavoritesContext';

export default function SavedScreen({ navigation }) {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const values = Object.values(favorites);
    const normalized = query.trim().toLowerCase();
    if (!normalized) return values;
    return values.filter((item) => (item.title || '').toLowerCase().includes(normalized));
  }, [favorites, query]);

  return (
    <ScreenContainer title="Saved" subtitle="Your favorite podcasts and shows">
      <TextInput
        style={styles.search}
        placeholder="Search saved..."
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.id || item.title}-${index}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.emptyWrap}><PodcastCard podcast={{ title: 'No favorites yet', author: 'Tap the star icon on any card' }} /></View>}
        renderItem={({ item }) => {
          if (item.kind === 'show') {
            const show = FEATURED_SHOWS.find((s) => s.id === item.id);
            const resolved = show || item;
            const keyId = resolved.id || resolved.title;
            return (
              <FeaturedShowCard
                show={resolved}
                favorite={isFavorite(`show:${keyId}`)}
                onToggleFavorite={() => toggleFavorite(`show:${keyId}`, {
                  kind: 'show',
                  id: keyId,
                  title: resolved.title,
                  query: resolved.query || resolved.title,
                  author: resolved.author || resolved.host,
                  image: resolved.image || resolved.logoUri,
                  logoUri: resolved.logoUri || resolved.image,
                })}
                onPlayPress={() => navigation.navigate('Player', {
                  showId: resolved.id,
                  title: resolved.title,
                  query: resolved.query || resolved.title,
                })}
                onPress={() => navigation.navigate('ShowDetail', {
                  showId: resolved.id,
                  show: resolved,
                })}
              />
            );
          }

          return (
            <PodcastCard
              podcast={item}
              onOpenAudio={() => navigation.navigate('PodcastEpisodes', { title: item.title })}
              favorite={isFavorite(`pod:${item.title}`)}
              onToggleFavorite={() => toggleFavorite(`pod:${item.title}`, item)}
            />
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  list: { paddingBottom: 24 },
  emptyWrap: { marginTop: 10 },
});
