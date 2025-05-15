import { createFileRoute } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_default/test/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-wrap gap-4">
      <TestComponent
        colorOne="bg-primary"
        colorTwo="bg-primary-foreground"
        card={true}
      />{" "}
      <TestComponent
        colorOne="bg-secondary"
        colorTwo="bg-secondary-foreground"
        card={true}
      />{" "}
      <TestComponent
        colorOne="bg-accent"
        colorTwo="bg-accent-foreground"
        card={true}
      />
      <TestComponent
        colorOne="bg-muted"
        colorTwo="bg-muted-foreground"
        card={true}
      />
      <TestComponent
        colorOne="bg-secondary"
        colorTwo="text-secondary-foreground"
        card={false}
      />{" "}
      <TestComponent
        colorOne="bg-background"
        colorTwo="text-foreground"
        card={false}
      />
      <TestComponent
        colorOne="bg-primary"
        colorTwo="text-primary-foreground"
        card={false}
      />
    </div>
  );
}

function TestComponent({
  colorOne,
  colorTwo,
  card,
}: {
  colorOne: string;
  colorTwo: string;
  card?: boolean;
}) {
  return (
    <>
      <div
        className={cn(colorOne, "w-[240px] h-[300px] p-2 border rounded-md")}
      >
        {card && <div className={cn(colorTwo, "w-full h-[200px] rounded")} />}
        {!card && <p className={colorTwo}>the fox jumps over the lazy dog</p>}
      </div>
    </>
  );
}
