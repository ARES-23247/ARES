import { useMemo } from "react";
import { isAfter, subDays, addDays, parseISO } from "date-fns";
import { EventItem } from "../components/events/EventCard";

/**
 * REF-F01: Extracted from Events.tsx to reduce page component complexity.
 * Memoizes expensive event filtering, sorting, and active competition detection.
 */
export function useEventFilters(events: EventItem[]) {
  return useMemo(() => {
    const now = new Date();
    const bufferTime = subDays(now, 1);

    const outreach = events.filter(e => e.category === "outreach");
    const internal = events.filter(e => e.category === "internal");
    const external = events.filter(e => e.category === "external");

    const sortAsc = (a: EventItem, b: EventItem) =>
      parseISO(a.date_start).getTime() - parseISO(b.date_start).getTime();

    return {
      upcomingOutreach: outreach.filter(e => isAfter(parseISO(e.date_start), bufferTime)).sort(sortAsc),
      upcomingPractices: internal.filter(e => isAfter(parseISO(e.date_start), bufferTime)).sort(sortAsc),
      upcomingExternal: external.filter(e => isAfter(parseISO(e.date_start), bufferTime)).sort(sortAsc),
      pastOutreach: outreach.filter(e => !isAfter(parseISO(e.date_start), bufferTime)).sort(sortAsc).reverse(),
      pastPractices: internal.filter(e => !isAfter(parseISO(e.date_start), bufferTime)).sort(sortAsc).reverse(),
      activeCompetition: events.find(e => {
        if (!e.tba_event_key) return false;
        const start = parseISO(e.date_start);
        const end = e.date_end ? parseISO(e.date_end) : addDays(start, 3);
        return now >= start && now <= end;
      })
    };
  }, [events]);
}
