import { motion } from 'framer-motion';

import { DiscoveryMasthead } from './discovery/discovery-title';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="mx-auto max-w-3xl md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex max-w-3xl flex-col gap-8 rounded-xl p-6 text-center leading-relaxed">
        <DiscoveryMasthead />
      </div>
    </motion.div>
  );
};
