import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { announcementCollection } from "~/db/collections/announcements";

export const Route = createFileRoute("/_default/test")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: todos } = useLiveQuery((query) =>
    query
      .from({ t: announcementCollection })
      .select("@t.id", "@t.year", "@t.number", "@t.content")
      .keyBy("@id")
  );

  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>
          <span>{todo.year}</span>
          <span>{todo.number}</span>
          <span>{todo.content}</span>
        </div>
      ))}
    </div>
  );
}
