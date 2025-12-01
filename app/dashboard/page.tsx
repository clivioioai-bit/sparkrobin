import Account from '@/page-components/Account'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Dashboard - Manage Your sora3 AI Account | sora3 AI',
  description: 'Manage your sora3 AI account settings, view usage, manage subscriptions and credits. Profile settings and account security management.',
}

export default function DashboardPage() {
  return <Account />
}

