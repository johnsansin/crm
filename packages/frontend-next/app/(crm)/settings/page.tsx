import { AuthGuard } from '@/components/AuthGuard'
import { SettingsPage } from '@/views/SettingsPage'
export default function Page() { return <AuthGuard role="admin"><SettingsPage /></AuthGuard> }
