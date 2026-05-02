import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  isToday,
} from "date-fns";
import { CalendarEvent } from "./EventMockData";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

interface MonthViewGridProps {
  currentDate: Date;
  events: CalendarEvent[];
}

export const MonthViewGrid = ({ currentDate, events }: MonthViewGridProps) => {
  const [overflowData, setOverflowData] = useState<{ day: Date, events: CalendarEvent[] } | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getEventsForDay = (day: Date) => {
    return events.filter(
      (event) =>
        isSameDay(event.start, day) ||
        (event.start <= day && event.end >= day)
    );
  };

  const getEventColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "internal":
        return "bg-ares-red text-white";
      case "outreach":
        return "bg-ares-gold text-black";
      case "external":
        return "bg-ares-cyan text-black";
      default:
        return "bg-white/20 text-white";
    }
  };

  return (
    <div className="w-full flex flex-col bg-obsidian border border-white/10 ares-cut-sm overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-bold uppercase tracking-widest text-marble/60"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] p-2 border-r border-b border-white/5 transition-colors ${
                !isCurrentMonth ? "bg-black/40 opacity-50" : "bg-transparent"
              } ${idx % 7 === 6 ? "border-r-0" : ""} hover:bg-white/5`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                    isCurrentDay
                      ? "bg-ares-red text-white"
                      : "text-marble"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                {dayEvents.slice(0, 3).map((event) => (
                  <Link
                    to={`/events/${event.id}`}
                    key={event.id}
                    className={`relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-sm truncate block transition-all hover:scale-105 hover:z-50 hover:shadow-lg origin-left ${getEventColor(
                      event.type
                    )}`}
                    title={event.title}
                  >
                    {format(event.start, "h:mm a")} - {event.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setOverflowData({ day, events: dayEvents });
                    }}
                    className="text-[10px] font-bold text-marble/50 px-1 hover:text-white transition-colors text-left w-full mt-1"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overflow Modal */}
      {overflowData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-obsidian border border-white/10 ares-cut p-6 max-w-sm w-full max-h-[80vh] flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setOverflowData(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {format(overflowData.day, "MMMM d, yyyy")}
              </h3>
              <p className="text-xs text-white/60 uppercase tracking-widest">{overflowData.events.length} Events</p>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
              {overflowData.events.map((event) => (
                <Link
                  to={`/events/${event.id}`}
                  key={event.id}
                  className={`text-xs font-bold px-3 py-2 rounded-sm block transition-all hover:brightness-110 ${getEventColor(event.type)}`}
                  title={event.title}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2">{event.title}</span>
                    <span className="opacity-80 shrink-0 whitespace-nowrap">{format(event.start, "h:mm a")}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
