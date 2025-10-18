"use client"

import { Home, Scan, Calendar, User, Heart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      isActive: pathname === "/",
      clickable: true
    },
    {
      href: "/appointments",
      icon: Calendar,
      label: "Appointments",
      isActive: pathname.startsWith("/appointments"),
      clickable: true
    },
    {
      href: "/skin-analysis",
      icon: Scan,
      label: null,
      isActive: pathname === "/skin-analysis",
      isCenter: true,
      clickable: true
    },
    {
      href: "/multimedia",
      icon: Heart,
      label: "Edu Hub",
      isActive: pathname.startsWith("/multimedia"),
      clickable: true
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
      isActive: pathname.startsWith("/profile"),
      clickable: true
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Main bottom navigation bar */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe">
        <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto relative">
          
          {navItems.map((item, index) => {
            // Handle center scan button differently
            if (item.isCenter) {
              return (
                <div key={item.href} className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <Link href={item.clickable ? item.href : "#"}>
                    <Button
                      size="icon"
                      disabled={!item.clickable}
                      className={`h-16 w-16 rounded-full shadow-2xl transition-all ${
                        item.isActive
                          ? "bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-800 hover:to-purple-800 scale-110"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105"
                      } text-white border-4 border-white dark:border-gray-900`}
                    >
                      <item.icon className="h-8 w-8" />
                    </Button>
                  </Link>
                  {/* Scan label below the button */}
                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className={`text-xs font-medium ${
                      item.isActive 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {item.label}
                    </span>
                  </div>
                </div>
              )
            }

            // Handle regular navigation buttons
            return (
              <div key={item.href} className="flex justify-center">
                {item.clickable ? (
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={`flex flex-col items-center gap-1 h-auto py-2 px-2 w-16 rounded-2xl transition-all ${
                        item.isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className={`text-xs ${item.isActive ? "font-bold" : "font-medium"}`}>
                        {item.label}
                      </span>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    disabled
                    className="flex flex-col items-center gap-1 h-auto py-2 px-2 w-16 rounded-2xl transition-all text-gray-400 cursor-not-allowed"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">
                      {item.label}
                    </span>
                  </Button>
                )}
              </div>
            )
          })}

        </div>
      </div>
    </div>
  )
}