import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RecentSale {
  id: number
  amount: number
  date: string
  customer: {
    name: string
    email: string
  }
}

interface RecentSalesProps {
  sales: RecentSale[]
}

export function RecentSales({ sales = [] }: RecentSalesProps) {
  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${sale.customer?.name || "Guest"}`} />
            <AvatarFallback>
              {(sale.customer?.name || "Guest")
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.customer?.name || "Guest"}</p>
            <p className="text-sm text-muted-foreground">{sale.customer?.email || "guest@example.com"}</p>
          </div>
          <div className="ml-auto font-medium">+${(sale.amount || 0).toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

