import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabs from './MainTabs';
import FramedPlayerScreen from '../screens/FramedPlayerScreen';
import PlayerScreen from '../screens/PlayerScreen';
import PodcastEpisodesScreen from '../screens/PodcastEpisodesScreen';
import ShowDetailScreen from '../screens/ShowDetailScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: true, title: 'Now Playing' }} />
        <Stack.Screen name="FramedPlayer" component={FramedPlayerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ShowDetail" component={ShowDetailScreen} options={{ headerShown: true, title: 'Show Detail' }} />
        <Stack.Screen name="PodcastEpisodes" component={PodcastEpisodesScreen} options={{ headerShown: true, title: 'Podcast Audio' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
