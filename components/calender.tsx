"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Bell,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { penNamesConversion } from "@/lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface CalendarEvent {
  id: string;
  date: string; // ISO 8601 UTC format, e.g., 2025-08-06T00:00:00Z
  title: string;
  description?: string;
  type: "event" | "notification";
  time?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  pens?: any[]
}

export default function Calendar({
  events = [],
  pens = [],
  onDateClick,
  onEventClick,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(dayjs().tz("Africa/Nairobi"));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = dayjs().tz("Africa/Nairobi");
  const currentMonth = currentDate.month();
  const currentYear = currentDate.year();

  // Get first day of month and number of days
  const firstDayOfMonth = currentDate.startOf("month");
  const lastDayOfMonth = currentDate.endOf("month");
  const firstDayWeekday = firstDayOfMonth.day();
  const daysInMonth = lastDayOfMonth.date();

  // Generate calendar days
  const calendarDays = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? prev.subtract(1, "month") : prev.add(1, "month")
    );
  };

  const formatDate = (day: number) => {
    return currentDate.date(day).format("YYYY-MM-DD");
  };

  const getEventsForDate = (day: number) => {
    const dateStr = formatDate(day);
    return events.filter((event) => {
      if (!dayjs(event.date).isValid()) {
        return false;
      }
      const eventDate = dayjs(event.date).tz("Africa/Nairobi").format("YYYY-MM-DD");
      return eventDate === dateStr;
    });
  };

  const isToday = (day: number) => {
    const date = currentDate.date(day);
    return date.isSame(today, "day");
  };

  const isPastDate = (day: number) => {
    const date = currentDate.date(day);
    return date.isBefore(today, "day");
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDate(day);
    setSelectedDate(dateStr);
    onDateClick?.(dateStr);
  };

  const selectedDateEvents = selectedDate
    ? events.filter((event) => {
      if (!dayjs(event.date).isValid()) return false;
      return dayjs(event.date).tz("Africa/Nairobi").format("YYYY-MM-DD") === selectedDate;
    })
    : [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 px-2 sm:px-4">
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-900/60 border-b border-gray-200 dark:border-gray-600">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900 dark:text-gray-100">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-base sm:text-xl">
              {monthNames[currentMonth]} {currentYear}
            </span>
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Next</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-1 sm:p-2 h-12 sm:h-16" />;
              }

              const dayEvents = getEventsForDate(day);
              const hasEvents = dayEvents.length > 0;
              const hasNotifications = dayEvents.some(
                (event) => event.type === "notification"
              );
              const hasPastEvents = dayEvents.some((event) => event.type === "event");

              return (
                <div
                  key={day}
                  className={`
                    p-0.5 sm:p-1 h-12 sm:h-16 border rounded-md sm:rounded-lg cursor-pointer transition-colors relative
                    ${isToday(day)
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white"
                      : "bg-white/50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }
                    ${selectedDate === formatDate(day)
                      ? "ring-1 sm:ring-2 ring-blue-500 dark:ring-blue-400"
                      : ""
                    }
                    ${isPastDate(day) ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}
                  `}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="text-xs sm:text-sm font-medium">{day}</div>

                  {/* Event indicators */}
                  <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                    {hasNotifications && (
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 dark:bg-blue-400 rounded-full"
                        title="Notification"
                      />
                    )}
                    {hasPastEvents && (
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 dark:bg-green-400 rounded-full"
                        title="Event"
                      />
                    )}
                  </div>

                  {/* Event count */}
                  {hasEvents && (
                    <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
                      <Badge
                        variant="secondary"
                        className="text-xs px-1 py-0 h-3 sm:h-4 min-w-[12px] sm:min-w-[16px] text-center bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      >
                        {dayEvents.length}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected date events */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-900/60 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm sm:text-base">
                Events for{" "}
                <span className="block sm:inline">
                  {dayjs(selectedDate)
                    .tz("Africa/Nairobi")
                    .format("dddd, MMMM D, YYYY")}
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
            <div className="space-y-4">
              {/* Past Events */}
              {selectedDateEvents.filter((event) => event.type === "event")
                .length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      Past Events
                    </h4>
                    <ul className="space-y-2 ml-4 sm:ml-6">
                      {selectedDateEvents
                        .filter((event) => event.type === "event")
                        .map((event) => (
                          <li
                            key={event.id}
                            className="flex items-start gap-2 sm:gap-3"
                          >
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 dark:bg-green-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                                <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words">
                                  {event.title}
                                </span>
                                {event.time && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs self-start bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                  >
                                    {event.time}
                                  </Badge>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                                  {penNamesConversion(pens, event.description)}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

              {/* Future Notifications */}
              {selectedDateEvents.filter((event) => event.type === "notification")
                .length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                      Upcoming Notifications
                    </h4>
                    <ul className="space-y-2 ml-4 sm:ml-6">
                      {selectedDateEvents
                        .filter((event) => event.type === "notification")
                        .map((event) => (
                          <li
                            key={event.id}
                            className="flex items-start gap-2 sm:gap-3"
                          >
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                                <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words">
                                  {event.title}
                                </span>
                                {event.time && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs self-start bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                  >
                                    {event.time}
                                  </Badge>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                                  {penNamesConversion(pens, event.description)}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for selected date with no events */}
      {selectedDate && selectedDateEvents.length === 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-900/60 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm sm:text-base">
                <span className="block sm:inline">
                  {dayjs(selectedDate)
                    .tz("Africa/Nairobi")
                    .format("dddd, MMMM D, YYYY")}
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
            <div className="text-center py-6 sm:py-8 text-gray-600 dark:text-gray-400">
              <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">
                No events or notifications for this date
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardContent className="pt-4 sm:pt-6 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 dark:bg-green-400 rounded-full" />
              <span>Past Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 dark:bg-blue-400 rounded-full" />
              <span>Future Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 dark:bg-blue-400 rounded-full" />
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
