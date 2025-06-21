import type { Event } from "@/db/queries";

export function EventsSection({ events }: { events: Event[] }) {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-1.5 mt-4">
      {events?.map((event: Event) => (
        <EventCard key={event.id} name={event.name} />
      ))}
    </div>
  );
}

function EventCard({ name }: { name: string }) {
  return (
    <div className="w-full max-w-sm bg-gray-100 rounded-t-md rounded-b-lg">
      <div className=" rounded-t-md bg-gray-100 px-4 py-2.5" />

      <div className="w-full p-4 rounded-t-lg rounded-b-md bg-ground">{name}</div>
    </div>
  );
}

