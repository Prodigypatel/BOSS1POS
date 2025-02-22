import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardPage from "./dashboard/page"

export default async function Home() {
  const cookieStore = cookies()
  const userRole = cookieStore.get("userRole")

  if (!userRole) {
    redirect("/auth/login")
  }

  return <DashboardPage />
}

