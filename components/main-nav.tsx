"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const router = useRouter()
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
        Dashboard
      </Link>

      {/* Add Register link */}
      <Link href="/register" className="text-sm font-medium transition-colors hover:text-primary">
        Register
      </Link>

      {/* Pages accessible to all roles */}
      <Link href="/transactions" className="text-sm font-medium transition-colors hover:text-primary">
        Transactions
      </Link>
      <Link href="/customers" className="text-sm font-medium transition-colors hover:text-primary">
        Customers
      </Link>

      {/* Only Managers & Admins */}
      {(role === "manager" || role === "admin") && (
        <>
          <Link href="/items" className="text-sm font-medium transition-colors hover:text-primary">
            Items
          </Link>
          <Link href="/reports" className="text-sm font-medium transition-colors hover:text-primary">
            Reports
          </Link>
        </>
      )}

      {/* Only Admins */}
      {role === "admin" && (
        <>
          <Link href="/promotions" className="text-sm font-medium transition-colors hover:text-primary">
            Promotions
          </Link>
          <Link href="/transfers" className="text-sm font-medium transition-colors hover:text-primary">
            Transfers
          </Link>
          <Link href="/settings" className="text-sm font-medium transition-colors hover:text-primary">
            Settings
          </Link>
        </>
      )}

      {/* Logout button */}
      <button onClick={handleLogout} className="text-sm font-medium text-red-500 transition-colors hover:text-red-700">
        Logout
      </button>
    </nav>
  )
}

