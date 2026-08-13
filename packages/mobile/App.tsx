import React from 'react'
import { ActivityIndicator, View, Text } from 'react-native'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from './src/auth'
import { LoginScreen } from './src/screens/LoginScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { ModulesScreen } from './src/screens/ModulesScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { ModuleListScreen } from './src/screens/ModuleListScreen'
import { ModuleDetailScreen } from './src/screens/ModuleDetailScreen'
import { COLORS } from './src/config'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
  },
}

function TabBarIcon({ route, focused }: { route: any; focused: boolean }) {
  const emoji = route.name === 'Home' ? '🏠' : route.name === 'Modules' ? '📁' : '⚙️'
  return <View style={{ opacity: focused ? 1 : 0.5 }}><Text style={{ fontSize: 18 }}>{emoji}</Text></View>
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused }) => <TabBarIcon route={route} focused={focused} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Modules" component={ModulesScreen} options={{ title: 'Modules' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
        {user ? (
          <>
            <Stack.Screen name="Tabs" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ModuleList" component={ModuleListScreen} options={({ route }: any) => ({ title: route.params?.module }) } />
            <Stack.Screen name="ModuleDetail" component={ModuleDetailScreen} options={{ title: 'Record' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
