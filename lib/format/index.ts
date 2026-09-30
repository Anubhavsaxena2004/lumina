export function formatRupee(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export function formatWeight(value: number) {
  return `${value.toFixed(3)} Kg`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB').format(new Date(value))
}
