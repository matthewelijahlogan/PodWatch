import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'podwatch_favorites_v1';

const FavoritesContext = createContext({
  favorites: {},
  toggleFavorite: async () => {},
  isFavorite: () => false,
  ready: false,
});

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setFavorites(parsed);
          }
        }
      } finally {
        if (mounted) setReady(true);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function toggleFavorite(id, payload) {
    let nextState;
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = payload;
      }
      nextState = next;
      return next;
    });

    if (nextState) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }
  }

  const value = useMemo(() => ({
    favorites,
    ready,
    isFavorite: (id) => Boolean(favorites[id]),
    toggleFavorite,
  }), [favorites, ready]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  return useContext(FavoritesContext);
}