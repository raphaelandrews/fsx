import { useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/utils/trpc";

// Circuit mutations must refresh both the admin lists and the public
// `circuits.list` query, which powers /circuitos and the admin editor itself.
export function useInvalidateCircuit() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries(trpc.circuits.list.queryFilter());
    qc.invalidateQueries(trpc.circuits.listSimple.queryFilter());
  };
}
