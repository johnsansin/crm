import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../auth'
import { apiCount, apiList } from '../api'
import { COLORS, recordTitle } from '../config'

const STAT_MODULES = [
  { key: 'accounts', label: 'Accounts', color: '#3b82f6' },
  { key: 'contacts', label: 'Contacts', color: '#10b981' },
  { key: 'leads', label: 'Leads', color: '#8b5cf6' },
  { key: 'potentials', label: 'Opportunities', color: '#f59e0b' },
  { key: 'tickets', label: 'Tickets', color: '#ef4444' },
]

export function DashboardScreen() {
  const navigation = useNavigation<any>()
  const { user, logout } = useAuth()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const next: Record<string, number> = {}
    for (const m of STAT_MODULES) {
      try { next[m.key] = await apiCount(m.key) } catch { next[m.key] = 0 }
    }
    setCounts(next)
    try {
      const leads = await apiList('leads', 5)
      setRecent(leads.data || [])
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <FlatList
      style={styles.bg}
      contentContainerStyle={styles.container}
      data={recent}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.greeting}>
            Welcome back, {user?.firstName || 'there'}
          </Text>
          <Text style={styles.subGreeting}>Here's what's happening today.</Text>

          <View style={styles.stats}>
            {STAT_MODULES.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.statCard, { borderLeftColor: m.color }]}
                onPress={() => navigation.navigate('ModuleList', { module: m.key })}
              >
                <Text style={[styles.statNumber, { color: m.color }]}>{counts[m.key] ?? '–'}</Text>
                <Text style={styles.statLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent leads</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ModuleList', { module: 'leads' })}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      ListEmptyComponent={
        loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} /> : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ModuleDetail', { module: 'leads', id: item.id })}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{((item.firstName?.[0] || '') + (item.lastName?.[0] || '')).toUpperCase() || 'L'}</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{recordTitle('leads', item)}</Text>
            {item.company ? <Text style={styles.rowSub}>{item.company}</Text> : null}
          </View>
          {item.leadStatus ? <Text style={styles.badge}>{item.leadStatus}</Text> : null}
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      }
    />
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 32 },
  greeting: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subGreeting: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 20 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%', backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statNumber: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  badge: {
    fontSize: 11, color: COLORS.primary, backgroundColor: '#eef2ff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontWeight: '600',
  },
  loader: { marginTop: 40 },
  logout: { marginTop: 24, alignItems: 'center', padding: 12 },
  logoutText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
})
