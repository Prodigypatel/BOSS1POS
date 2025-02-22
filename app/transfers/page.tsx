import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TransfersPage() {
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
          <h2 className="text-3xl font-bold tracking-tight">Transfers</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Stock Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Stock transfer functionality is coming soon. This page will allow you to manage stock transfers between
              store locations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

