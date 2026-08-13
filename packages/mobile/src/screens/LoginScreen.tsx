import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../auth'
import { apiBase } from '../api'
import { COLORS } from '../config'

export function LoginScreen() {
  const { login, complete2FA, requires2FA } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const doLogin = async () => {
    if (!email || !password) {
      setError('Enter your email and password')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const do2FA = async () => {
    if (!code) return
    setBusy(true)
    setError(null)
    try {
      await complete2FA(code)
    } catch (e: any) {
      setError(e.message || 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.logo}>BizForce</Text>
          <Text style={styles.tagline}>CRM on the go</Text>
        </View>

        {requires2FA ? (
          <View style={styles.card}>
            <Text style={styles.title}>Two-factor verification</Text>
            <Text style={styles.subtitle}>Enter the 6-digit code from your authenticator app.</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              autoFocus
            />
            <TouchableOpacity style={styles.button} onPress={do2FA} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
            </TouchableOpacity>
            <Text style={styles.serverHint}>Server: {apiBase()}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>Sign in</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity style={styles.button} onPress={doLogin} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
            </TouchableOpacity>
            <Text style={styles.serverHint}>Server: {apiBase()}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.primary },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 40, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: '#c7d2fe', marginTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.text, marginBottom: 12, backgroundColor: '#fff',
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  error: { color: COLORS.danger, fontSize: 13, marginBottom: 8 },
  serverHint: { textAlign: 'center', color: COLORS.textMuted, fontSize: 11, marginTop: 16 },
})
