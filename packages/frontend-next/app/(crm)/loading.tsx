import { BrandLoader } from '@/components/BrandLoader'

export default function CrmLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <BrandLoader label="Loading BizForce CRM" />
    </div>
  )
}