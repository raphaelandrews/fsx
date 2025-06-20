"use client";

import { CircuitTableSkeleton } from "./components/circuit-table-skeleton";
import Title from "@/components/ui/title";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen max-w-full max-h-full pb-20 pt-30">
      <Title label="Circuitos" />
      <CircuitTableSkeleton />
    </div>
  );
};

export default Loading;
