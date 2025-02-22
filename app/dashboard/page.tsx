"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { BarChart3, DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { Overview } from "@/components/overview"
import { RecentSales } from "@/components/recent-sales"
import { getDashboardMetrics, getMonthlySalesData, getRecentSales, getLowStockItems } from "@/lib/dashboard"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  subtitle?: string
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<{
    revenue: { total: number; change: number }
    inventory: { value: number; change: number }
    sales: { total: number; lastHour: number }
    customers: { total: number; change: number }
  } | null>(null)
  const [monthlyData, setMonthlyData] = useState<Array<{ name: string; total: number }>>([])
  const [recentSales, setRecentSales] = useState<
    Array<{
      id: number
      amount: number
      date: string
      customer: { name: string; email: string }
    }>
  >([])
  const [lowStockItems, setLowStockItems] = useState<
    Array<{
      id: number
      name: string
      quantity: number
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setIsLoading(true)
      const [metricsData, salesData, recentSalesData, lowStockData] = await Promise.all([
        getDashboardMetrics(),
        getMonthlySalesData(),
        getRecentSales(),
        getLowStockItems(),
      ])

      setMetrics(metricsData)
      setMonthlyData(salesData)
      setRecentSales(recentSalesData)
      setLowStockItems(lowStockData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const MetricCard = ({ title, value, change, icon: Icon, subtitle }: MetricCardProps) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-[100px]" />
        ) : (
          <>
            <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
            {change !== undefined && (
              <p className="text-xs text-muted-foreground">
                {change >= 0 ? "+" : ""}
                {change.toFixed(1)}% from last month
              </p>
            )}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="hidden flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker />
            <Button>Download</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={metrics ? `$${(metrics.revenue.total || 0).toFixed(2)}` : "$0.00"}
            change={metrics?.revenue.change ?? 0}
            icon={DollarSign}
          />
          <MetricCard
            title="Inventory Value"
            value={metrics ? `$${(metrics.inventory.value || 0).toFixed(2)}` : "$0.00"}
            change={metrics?.inventory.change ?? 0}
            icon={Package}
          />
          <MetricCard
            title="Sales"
            value={metrics?.sales.total ?? 0}
            subtitle={`+${metrics?.sales.lastHour ?? 0} since last hour`}
            icon={ShoppingCart}
          />
          <MetricCard
            title="Active Customers"
            value={metrics?.customers.total ?? 0}
            change={metrics?.customers.change ?? 0}
            icon={Users}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              {isLoading ? <Skeleton className="h-[350px] w-full" /> : <Overview data={monthlyData} />}
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>You made {metrics?.sales.total || 0} sales this month.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <RecentSales sales={recentSales} />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Items that need restocking soon.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-8 w-[80px]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} units remaining</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Restock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/register">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  New Sale
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/items">
                  <Package className="mr-2 h-4 w-4" />
                  Add Inventory
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/customers">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Customers
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

