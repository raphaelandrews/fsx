import { motion, AnimatePresence } from "framer-motion";

import { RatingUpdateMotionGrid } from "./rating-update-motion-grid";
import { RatingUpdateProgress } from "./rating-update-progress";

export function RatingUpdateMonitor() {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
      <div>
        <RatingUpdateMotionGrid />
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          initial={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <RatingUpdateProgress />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
