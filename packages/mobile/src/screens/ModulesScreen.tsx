import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { COLORS, MODULES } from '../config'

export function ModulesScreen() {
  const navigation = useNavigation<any>()

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={MODULES}
      keyExtractor={(m) => m.key}
      numColumns={2}
      columnWrapperStyle={styles.rowWrap}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ModuleList', { module: item.key })}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 12, paddingBottom: 32 },
  rowWrap: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 18, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center',
  },
  icon: { fontSize: 26, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
})
