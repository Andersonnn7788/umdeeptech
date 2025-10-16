"use client"

import { Home, Scan, Calendar } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function BottomNavigation() {
  const pathname = usePathname()

  const sideNavItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      isActive: pathname === "/"
    },
    {
      href: "/appointments",
      icon: Calendar,
      label: "Appointments",
      isActive: pathname.startsWith("/appointments")
    }
  ]

  const isScanActive = pathname === "/skin-analysis"

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Main bottom navigation bar */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe">
        <div className="flex items-center justify-between px-8 py-3 max-w-md mx-auto relative">
          
          {/* Left navigation item */}
          <div className="flex justify-center">
            <Link href={sideNavItems[0].href}>
              <Button
                variant="ghost"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 w-20 rounded-2xl transition-all ${
                  sideNavItems[0].isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Home className={`h-5 w-5`} />
                <span className={`text-xs ${sideNavItems[0].isActive ? "font-bold" : "font-medium"}`}>
                  {sideNavItems[0].label}
                </span>
              </Button>
            </Link>
          </div>

          {/* Center scan button - elevated circle */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <Link href="/skin-analysis">
              <Button
                size="icon"
                className={`h-16 w-16 rounded-full shadow-2xl transition-all ${
                  isScanActive
                    ? "bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-800 hover:to-purple-800 scale-110"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105"
                } text-white border-4 border-white dark:border-gray-900`}
              >
                <Scan className="h-8 w-8" />
              </Button>
            </Link>
            {/* Scan label below the button */}
            <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className={`text-xs font-medium ${
                isScanActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                Scan
              </span>
            </div>
          </div>

          {/* Right navigation item */}
          <div className="flex justify-center">
            <Link href={sideNavItems[1].href}>
              <Button
                variant="ghost"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 w-20 rounded-2xl transition-all ${
                  sideNavItems[1].isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Calendar className={`h-5 w-5`} />
                <span className={`text-xs ${sideNavItems[1].isActive ? "font-bold" : "font-medium"}`}>
                  {sideNavItems[1].label}
                </span>
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}