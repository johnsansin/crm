import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { apiGet, apiUpdate } from '../api'
import { COLORS, DETAIL_FIELDS, recordTitle } from '../config'

const SKIP = ['id', 'companyId', 'createdAt', 'updatedAt', 'isActive', 'isDeleted', 'createdById', 'assignedToId']

function labelFor(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/Id$/i, ' ID')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function ModuleDetailScreen() {
  const route = useRoute<any>()
  const module = route.params?.module as string
  const id = route.params?.id as string
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await apiGet(module, id)
        setRecord(data.data || data)
      } catch {}
      setLoading(false)
    })()
  }, [module, id])

  const fields = (DETAIL_FIELDS[module] || Object.keys(record || {})).filter(f => !SKIP.includes(f))

  const beginEdit = () => {
    setForm({ ...record })
    setEdit(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const updated = await apiUpdate(module, id, form)
      setRecord(updated.data || form)
      setEdit(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      alert(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
  }
  if (!record) {
    return <View style={styles.center}><Text>Record not found</Text></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(recordTitle(module, record) || '?')[0].toUpperCase()}</Text></View>
        <Text style={styles.title}>{recordTitle(module, record)}</Text>
      </View>

      {fields.map((f) => {
        const value = edit ? form[f] : record[f]
        if (edit) {
          return (
            <View key={f} style={styles.field}>
              <Text style={styles.label}>{labelFor(f)}</Text>
              <TextInput
                style={styles.input}
                value={value == null ? '' : String(value)}
                onChangeText={(v) => setForm((p: any) => ({ ...p, [f]: v }))}
              />
            </View>
          )
        }
        if (value == null || value === '') return null
        return (
          <View key={f} style={styles.field}>
            <Text style={styles.label}>{labelFor(f)}</Text>
            <Text style={styles.value}>{String(value)}</Text>
          </View>
        )
      })}

      <View style={styles.actions}>
        {edit ? (
          <>
            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{saved ? 'Saved ✓' : 'Save changes'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEdit(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.saveBtn} onPress={beginEdit}>
            <Text style={styles.saveText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 18 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, flex: 1 },
  field: { backgroundColor: COLORS.card, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  value: { fontSize: 15, color: COLORS.text },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: COLORS.text, backgroundColor: '#fff' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  saveBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 14, alignItems: 'center', backgroundColor: COLORS.card },
  cancelText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 15 },
})
