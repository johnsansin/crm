import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useAuth } from '../auth'
import { apiBase } from '../api'
import { COLORS } from '../config'

export function SettingsScreen() {
  const { user, logout } = useAuth()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}</Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.company}>{user?.company?.name || 'BizForce'}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Server</Text>
          <Text style={styles.infoValue}>{apiBase()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{user?.isAdmin ? 'Administrator' : 'User'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>API key tip</Text>
          <Text style={styles.infoValue}>Set EXPO_PUBLIC_API_URL to change server</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  profile: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 26 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  company: { fontSize: 13, marginTop: 8, backgroundColor: '#eef2ff', color: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  card: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 13, color: COLORS.textMuted },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, flexShrink: 1, textAlign: 'right' },
  logout: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
})
