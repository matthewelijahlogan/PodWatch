import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ContactScreen from '../screens/ContactScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import GuideScreen from '../screens/GuideScreen';
import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import TopShowsScreen from '../screens/TopShowsScreen';

const Tab = createBottomTabNavigator();

function iconByRoute(routeName) {
  if (routeName === 'Home') return 'home-outline';
  if (routeName === 'TopShows') return 'tv-outline';
  if (routeName === 'Guide') return 'list-outline';
  if (routeName === 'Discover') return 'compass-outline';
  if (routeName === 'Saved') return 'bookmark-outline';
  return 'mail-outline';
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#f8fafc',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 58 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          backgroundColor: '#0b1328',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          paddingBottom: 2,
        },
        tabBarIcon: ({ color, size }) => <Ionicons name={iconByRoute(route.name)} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="TopShows" component={TopShowsScreen} options={{ title: 'Top Shows' }} />
      <Tab.Screen name="Guide" component={GuideScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Contact" component={ContactScreen} />
    </Tab.Navigator>
  );
}
