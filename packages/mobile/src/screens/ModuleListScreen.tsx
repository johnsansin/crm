import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { apiList } from '../api'
import { COLORS, MODULES, recordTitle, recordSubtitle } from '../config'

export function ModuleListScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const module = route.params?.module as string
  const mod = MODULES.find(m => m.key === module)
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await apiList(module, 100)
      setRows(data.data || [])
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }, [module])

  useEffect(() => { load() }, [load])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = search.trim().length >= 2
    ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
    : rows

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder={`Search ${mod?.label || module}...`}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        ListEmptyComponent={
          loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} /> : (
            <Text style={styles.empty}>No records found</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('ModuleDetail', { module, id: item.id })}
          >
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{recordTitle(module, item)}</Text>
              <Text style={styles.rowSub}>{recordSubtitle(module, item)}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  search: {
    margin: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, backgroundColor: COLORS.card,
  },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  chevron: { fontSize: 20, color: COLORS.textMuted },
  loader: { marginTop: 40 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 14 },
})
