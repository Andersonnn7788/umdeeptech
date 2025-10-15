"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, Star, MessageSquare, Heart, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useDoctors } from '@/lib/hooks/useAppointments'
const categories = ["All", "Medical", "Surgical", "Pediatric", "Allergy"]


export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const { doctors, loading, error } = useDoctors(selectedCategory)

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || doctor.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-4xl mx-auto px-4 py-4">
          <Link href="/appointments">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-sans text-xl font-bold text-foreground">Select Doctor</h1>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        <div className="mb-5 relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Doctor"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-base"
          />
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap rounded-full px-6 shadow-sm font-semibold ${
                selectedCategory === category ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all" : "bg-white dark:bg-gray-800 hover:bg-muted border border-gray-200 dark:border-gray-700"
              }`}
              size="default"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading doctors...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No doctors found matching your criteria.</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="p-5 shadow-md rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
                  <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                    {doctor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground mb-1 text-base">{doctor.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{doctor.specialty}</p>

                  <div className="flex items-center gap-1 mb-4">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-foreground">{doctor.rating}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/appointments/book/${doctor.id}`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all h-11 font-semibold">
                        Appointment
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-muted"
                    >
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-muted"
                    >
                      <Heart className="h-5 w-5 text-primary" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}