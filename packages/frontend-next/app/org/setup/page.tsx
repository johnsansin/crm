import { AuthGuard } from '@/components/AuthGuard'
import { OrgProfilePage } from '@/views/OrgProfilePage'
export default function Page() { return <AuthGuard><OrgProfilePage /></AuthGuard> }
