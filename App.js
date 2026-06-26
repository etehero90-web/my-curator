import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, TouchableOpacity, Text, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './src/constants/theme';

import HomeScreen from './src/screens/HomeScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import FavoriteUsersScreen from './src/screens/FavoriteUsersScreen';
import ImportScreen from './src/screens/ImportScreen';
import QRScanScreen from './src/screens/QRScanScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors;

  const [currentScreen, setCurrentScreen] = useState(null);
  const [screenParams, setScreenParams] = useState(null);
  const [screenHistory, setScreenHistory] = useState([]);
  const [homeState, setHomeState] = useState(null);

  const navigate = (screen, params, savedHomeState) => {
    if (savedHomeState) setHomeState(savedHomeState);
    setScreenHistory(prev =>
      currentScreen ? [...prev, { screen: currentScreen, params: screenParams }] : prev
    );
    setCurrentScreen(screen);
    setScreenParams(params);
  };

  const goBack = () => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory(h => h.slice(0, -1));
      setCurrentScreen(prev.screen);
      setScreenParams(prev.params);
    } else {
      setCurrentScreen(null);
      setScreenParams(null);
    }
  };

  if (currentScreen === 'PostDetail') {
    return <PostDetailScreen
      route={{ params: screenParams }}
      navigation={{ navigate, goBack }}
    />;
  }

  if (currentScreen === 'UserProfile') {
    return <UserProfileScreen
      route={{ params: screenParams }}
      navigation={{ navigate, goBack }}
    />;
  }

  if (currentScreen === 'FavoriteUsers') {
    return <FavoriteUsersScreen
      navigation={{ navigate, goBack }}
    />;
  }

  if (currentScreen === 'Import') {
    return <ImportScreen
      navigation={{ navigate, goBack }}
    />;
  }

  if (currentScreen === 'QRScan') {
    return <QRScanScreen
      navigation={{ navigate, goBack }}
    />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: C.inactive,
          tabBarStyle: {
            backgroundColor: C.cardBg,
            borderTopColor: C.border,
            borderTopWidth: 1,
            paddingBottom: 20,
            paddingTop: 6,
            height: 80,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: C.background },
          headerTintColor: C.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
        }}
      >
        <Tab.Screen
          name="Feed"
          options={{
            headerTitle: 'My AI Curator',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => Linking.openURL('https://ko-fi.com/mycurator')}
                style={{ marginRight: 16 }}
              >
                <Text style={{ fontSize: 22 }}>☕</Text>
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        >
          {() => <HomeScreen navigation={{ navigate, goBack }} savedState={homeState} onSaveState={setHomeState} />}
        </Tab.Screen>
        <Tab.Screen
          name="Insights"
          component={InsightsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="options" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        >
          {() => <ProfileScreen navigation={{ navigate, goBack }} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}