import type { OrderStatus } from '../api/types'

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

export function formatPrice(amount: number): string {
  return vnd.format(amount)
}

export function formatDate(iso: string): string {
  return dateTime.format(new Date(iso))
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
}

export const PHONE_PATTERN = /^(0|\+84)[0-9]{9}$/
