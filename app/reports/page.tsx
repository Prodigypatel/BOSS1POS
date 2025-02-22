"use client"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  })
  const [selectedReport, setSelectedReport] = useState("sales-summary")
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    fetchReportData()
  }, [selectedReport, dateRange])

  const fetchReportData = async () => {
    // Convert dates to ISO string format
    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    const { data, error } = await supabase.from("sales").select("*").gte("date", fromDate).lte("date", toDate)

    if (error) {
      console.error("Error fetching report data:", error)
      return
    }

    // Process the data based on the selected report type
    let processedData
    switch (selectedReport) {
      case "sales-summary":
        processedData = processSalesSummary(data)
        break
      case "hourly-sales":
        processedData = processHourlySales(data)
        break
      // Add more cases for other report types
      default:
        processedData = data
    }

    setReportData(processedData)
  }

  const processSalesSummary = (data: any[]) => {
    const summary = {
      totalSales: data.reduce((sum, sale) => sum + sale.total, 0),
      transactions: data.length,
      refunds: data.filter((sale) => sale.type === "refund").length,
      tax: data.reduce((sum, sale) => sum + sale.tax, 0),
      paymentTypes: [
        { name: "Cash", value: data.filter((sale) => sale.payment_method === "cash").length },
        { name: "Credit Card", value: data.filter((sale) => sale.payment_method === "credit").length },
        { name: "Debit Card", value: data.filter((sale) => sale.payment_method === "debit").length },
      ],
      dailySales: processDailySales(data),
    }
    return summary
  }

  const processDailySales = (data: any[]) => {
    const dailySales: { [key: string]: number } = {}
    data.forEach((sale) => {
      const date = new Date(sale.date).toISOString().split("T")[0]
      dailySales[date] = (dailySales[date] || 0) + sale.total
    })
    return Object.entries(dailySales).map(([date, sales]) => ({ date, sales }))
  }

  const processHourlySales = (data: any[]) => {
    const hourlySales: { [key: string]: { sales: number; transactions: number } } = {}
    data.forEach((sale) => {
      const hour = new Date(sale.date).getHours()
      if (!hourlySales[hour]) {
        hourlySales[hour] = { sales: 0, transactions: 0 }
      }
      hourlySales[hour].sales += sale.total
      hourlySales[hour].transactions += 1
    })
    return Object.entries(hourlySales).map(([hour, data]) => ({
      hour: `${hour}:00`,
      sales: data.sales,
      transactions: data.transactions,
    }))
  }

  const renderReport = () => {
    if (!reportData) return null

    switch (selectedReport) {
      case "sales-summary":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${reportData.totalSales.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.transactions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Refunds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.refunds}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${reportData.tax.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.paymentTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.paymentTypes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={["#0088FE", "#00C49F", "#FFBB28"][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )
      case "hourly-sales":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales</CardTitle>
              <CardDescription>Sales and transactions breakdown by hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Sales ($)" />
                  <Bar yAxisId="right" dataKey="transactions" fill="#82ca9d" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      // Add more cases for other report types
      default:
        return null
    }
  }

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
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker date={dateRange} setDate={setDateRange} />
            <Button>Download</Button>
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales-summary">Sales Summary</SelectItem>
                  <SelectItem value="hourly-sales">Hourly Sales</SelectItem>
                  {/* Add more SelectItem elements for other report types */}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          {renderReport()}
        </div>
      </div>
    </div>
  )
}

