export const recentEntries = [
  { id: 'KP-1048', party: 'Shree Jewellers', type: 'Sale', amount: 84200, status: 'partial', date: '30/09/2026' },
  { id: 'KP-1047', party: 'Ramesh Lal & Sons', type: 'Purchase', amount: 126500, status: 'paid', date: '29/09/2026' },
  { id: 'KP-1046', party: 'Aarav Gold House', type: 'Sale', amount: 38900, status: 'open', date: '28/09/2026' },
  { id: 'KP-1045', party: 'Maya Jewels', type: 'Job work', amount: 17500, status: 'overdue', date: '27/09/2026' },
]

export const stockSummary = [
  { label: 'Gold ornaments', value: '2.840 Kg', detail: '24 items', tone: 'gold' },
  { label: 'Silver ornaments', value: '18.420 Kg', detail: '156 items', tone: 'silver' },
  { label: 'Loose stones', value: '348 pcs', detail: '8 categories', tone: 'red' },
]

export const navGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', icon: 'LayoutDashboard' }] },
  { label: 'Business', items: [{ label: 'Entries', icon: 'ReceiptText' }, { label: 'Parties', icon: 'UsersRound' }, { label: 'Stock', icon: 'Boxes' }, { label: 'Cash and Bank', icon: 'WalletCards' }] },
  { label: 'Operations', items: [{ label: 'Job Work', icon: 'BriefcaseBusiness' }, { label: 'Staff', icon: 'UserRoundCog' }, { label: 'Reminders', icon: 'BellRing' }] },
  { label: 'Control', items: [{ label: 'Audit Log', icon: 'ShieldCheck' }] },
]

export const reminders = [
  { title: 'Payment due from Shree Jewellers', meta: '₹42,000 · Due today', tone: 'red' },
  { title: 'Job work delivery', meta: 'Maya Jewels · Tomorrow', tone: 'gold' },
  { title: 'Stock count scheduled', meta: 'Friday, 4 October', tone: 'blue' },
]

export const activity = [
  { title: 'New sale entry added', by: 'Amit Sharma', time: '12 min ago', initials: 'AS', tone: 'red' },
  { title: 'Payment marked as received', by: 'Priya Verma', time: '1 hr ago', initials: 'PV', tone: 'gold' },
  { title: 'Stock adjustment recorded', by: 'Amit Sharma', time: '3 hrs ago', initials: 'AS', tone: 'red' },
]

export const dashboardStats = [
  { label: 'Receivables', value: '₹4,28,500', change: '+12.4%', caption: 'vs last month', tone: 'red', icon: 'ArrowDownLeft' },
  { label: 'Payables', value: '₹1,86,200', change: '-4.8%', caption: 'vs last month', tone: 'gold', icon: 'ArrowUpRight' },
  { label: 'Stock value', value: '₹28,64,750', change: '+8.2%', caption: 'vs last month', tone: 'green', icon: 'Gem' },
  { label: 'Cash in hand', value: '₹2,14,680', change: '+2.1%', caption: 'vs last month', tone: 'blue', icon: 'Banknote' },
]

export type EntryStatus = 'open' | 'partial' | 'paid' | 'overdue'

export const statusLabels: Record<EntryStatus, string> = { open: 'Open', partial: 'Partially paid', paid: 'Paid', overdue: 'Overdue' }
export const statusTones: Record<EntryStatus, string> = { open: 'status-open', partial: 'status-partial', paid: 'status-paid', overdue: 'status-overdue' }

export const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
export const formatKg = (amount: number) => `${amount.toFixed(3)} Kg`
export const formatDate = (date: string) => date
export const formatCompact = (amount: number) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)

export const formatters = { formatINR, formatKg, formatDate, formatCompact }
export const mockData = { recentEntries, stockSummary, navGroups, reminders, activity, dashboardStats }

export default mockData
