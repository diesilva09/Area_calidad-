"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

export interface SimpleCalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
  modifiers?: {
    pending?: Date[]
    completed?: Date[]
  }
  modifiersClassNames?: {
    pending?: string
    completed?: string
  }
}

export function SimpleCalendar({
  selected = new Date(),
  onSelect,
  className,
  modifiers = {},
  modifiersClassNames = {}
}: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Add empty cells for days before month starts
  const startDayOfWeek = getDay(monthStart)
  // Convert JS day (0=Dom..6=Sáb) to Monday-first offset (0=Lun..6=Dom)
  const mondayFirstOffset = (startDayOfWeek + 6) % 7
  const emptyDays = Array(mondayFirstOffset).fill(null)

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const getDayModifiers = (day: Date) => {
    const classes: string[] = []
    if (modifiers.pending?.some((d) => isSameDay(d, day))) {
      classes.push(modifiersClassNames.pending || 'bg-accent/70')
    }
    if (modifiers.completed?.some((d) => isSameDay(d, day))) {
      classes.push(modifiersClassNames.completed || 'bg-success text-success-foreground')
    }
    return classes.join(' ')
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </div>
        <button
          onClick={nextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-muted-foreground rounded-md h-8 font-normal text-[0.8rem] flex items-center justify-center text-xs sm:text-sm"
          >
            {day}
          </div>
        ))}
        
        {/* Empty cells before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-9" />
        ))}
        
        {/* Month days */}
        {monthDays.map((day) => {
          const isSelected = selected && isSameDay(day, selected)
          const isToday = isSameDay(day, new Date())
          const modifiers = getDayModifiers(day)
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect?.(day)}
              className={cn(
                "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center rounded-md transition-all",
                "hover:bg-accent/50",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isToday && !isSelected && "bg-accent text-accent-foreground",
                modifiers
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
