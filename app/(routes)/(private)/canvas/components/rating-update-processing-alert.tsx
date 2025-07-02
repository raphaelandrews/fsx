import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoaderCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RatingUpdateProcessingAlert({
  operation,
  table,
}: {
  operation: string;
  table: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 hidden justify-center">
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          key={crypto.randomUUID()}
          transition={{ duration: 0.4 }}
        >
          <Alert>
            <LoaderCircleIcon className="animate-spin" />
            <AlertTitle>{operation}</AlertTitle>
            <AlertDescription>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge
                  className="bg-gray-100 text-gray-700"
                  variant="secondary"
                >
                  {table}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700">Processing</Badge>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
