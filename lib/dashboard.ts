import { supabase } from "./supabase"

interface DashboardMetrics {
  revenue: {
    total: number
    change: number
  }
  inventory: {
    value: number
    change: number
  }
  sales: {
    total: number
    lastHour: number
  }
  customers: {
    total: number
    change: number
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  const lastHour = new Date(today.getTime() - 60 * 60 * 1000)

  // Get total revenue and comparison
  const { data: revenueData, error: revenueError } = await supabase
    .from("transactions")
    .select("amount, date")
    .gte("date", lastMonth.toISOString())
    .eq("type", "sale")
    .eq("status", "completed")

  if (revenueError) {
    console.error("Revenue fetch error:", revenueError)
    return {
      revenue: { total: 0, change: 0 },
      inventory: { value: 0, change: 0 },
      sales: { total: 0, lastHour: 0 },
      customers: { total: 0, change: 0 },
    }
  }

  const currentMonthRevenue = (revenueData || [])
    .filter((t) => new Date(t.date) > lastMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const previousMonthRevenue = (revenueData || [])
    .filter((t) => new Date(t.date) <= lastMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const revenueChange = previousMonthRevenue
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0

  // Get inventory value
  const { data: inventoryData, error: inventoryError } = await supabase.from("items").select("quantity, average_cost")

  if (inventoryError) {
    console.error("Inventory fetch error:", inventoryError)
    return {
      revenue: { total: currentMonthRevenue, change: revenueChange },
      inventory: { value: 0, change: 0 },
      sales: { total: 0, lastHour: 0 },
      customers: { total: 0, change: 0 },
    }
  }

  const inventoryValue = (inventoryData || []).reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.average_cost || 0),
    0,
  )

  // Get sales counts
  const { data: salesData, error: salesError } = await supabase
    .from("transactions")
    .select("date")
    .eq("type", "sale")
    .eq("status", "completed")
    .gte("date", lastHour.toISOString())

  if (salesError) {
    console.error("Sales fetch error:", salesError)
    return {
      revenue: { total: currentMonthRevenue, change: revenueChange },
      inventory: { value: inventoryValue, change: 0 },
      sales: { total: 0, lastHour: 0 },
      customers: { total: 0, change: 0 },
    }
  }

  const totalSales = (salesData || []).length
  const lastHourSales = (salesData || []).filter((s) => new Date(s.date) > lastHour).length

  // Get active customers count
  const { data: customerData, error: customerError } = await supabase.from("customers").select("id")

  if (customerError) {
    console.error("Customer fetch error:", customerError)
    return {
      revenue: { total: currentMonthRevenue, change: revenueChange },
      inventory: { value: inventoryValue, change: 0 },
      sales: { total: totalSales, lastHour: lastHourSales },
      customers: { total: 0, change: 0 },
    }
  }

  return {
    revenue: {
      total: currentMonthRevenue,
      change: revenueChange,
    },
    inventory: {
      value: inventoryValue,
      change: 0, // Calculate this if historical data is available
    },
    sales: {
      total: totalSales,
      lastHour: lastHourSales,
    },
    customers: {
      total: (customerData || []).length,
      change: 0, // Calculate this if historical data is available
    },
  }
}

interface SalesData {
  name: string
  total: number
}

export async function getMonthlySalesData(): Promise<SalesData[]> {
  const today = new Date()
  const startOfYear = new Date(today.getFullYear(), 0, 1)

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, date")
    .gte("date", startOfYear.toISOString())
    .eq("type", "sale")
    .eq("status", "completed")

  if (error) {
    console.error("Monthly sales fetch error:", error)
    return Array(12)
      .fill(0)
      .map((_, i) => ({
        name: new Date(0, i).toLocaleString("default", { month: "short" }),
        total: 0,
      }))
  }

  const monthlyData = Array(12)
    .fill(0)
    .map((_, i) => ({
      name: new Date(0, i).toLocaleString("default", { month: "short" }),
      total: 0,
    }))
  ;(data || []).forEach((transaction) => {
    const date = new Date(transaction.date)
    const monthIndex = date.getMonth()
    monthlyData[monthIndex].total += transaction.amount || 0
  })

  return monthlyData
}

interface RecentSale {
  id: number
  amount: number
  date: string
  customer: {
    name: string
    email: string
  } | null
}

export async function getRecentSales(): Promise<RecentSale[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      amount,
      date,
      customer:customer_id (
        name,
        email
      )
    `)
    .eq("type", "sale")
    .eq("status", "completed")
    .order("date", { ascending: false })
    .limit(5)

  if (error) {
    console.error("Recent sales fetch error:", error)
    return []
  }

  return (data || []).map((sale) => ({
    id: sale.id,
    amount: sale.amount || 0,
    date: sale.date,
    customer: sale.customer || { name: "Guest", email: "guest@example.com" },
  }))
}

interface LowStockItem {
  id: number
  name: string
  quantity: number
}

export async function getLowStockItems(): Promise<LowStockItem[]> {
  const { data, error } = await supabase
    .from("items")
    .select("id, name, quantity")
    .lt("quantity", 10)
    .order("quantity")
    .limit(5)

  if (error) {
    console.error("Low stock items fetch error:", error)
    return []
  }

  return data || []
}

