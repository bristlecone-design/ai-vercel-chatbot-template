import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

/**
 * Animated Success Check
 *
 * @resources
 *  - https://blog.noelcserepy.com/how-to-animate-svg-paths-with-framer-motion
 *  - https://codesandbox.io/s/path-examples-basic-qzpy35?from-embed=&file=/src/Example.jsx
 */

export const AnimatedSuccessCheck = ({ className }: { className?: string }) => {
  // const pathLength = useMotionValue(0);
  // const opacity = useTransform(pathLength, [0.05, 0.15], [0, 1]);
  // console.log(`animation values`, pathLength, opacity);

  // Animate each path and polyline individually on mount
  return (
    <motion.svg
      // initial={{
      //   opacity: 0,
      //   scale: 0,
      // }}
      // animate={{
      //   opacity: 1,
      //   scale: 1,
      // }}
      // exit={{
      //   opacity: 1,
      //   scale: 1,
      // }}
      fill="none"
      stroke="currentColor"
      whileHover="hover"
      whileTap="pressed"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-6', className)}
    >
      {/* Circle */}
      <motion.path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        strokeWidth="1"
        initial={{ scale: 0.25, pathLength: 0, strokeWidth: 0 }}
        animate={{ scale: 1, pathLength: [0, 1], strokeWidth: [0, 1] }}
        transition={{
          duration: 0.9,
          ease: 'easeInOut',
          // repeat: 0,
          // repeatType: 'mirror',
          // repeatDelay: 0.5,
        }}
      />
      {/* Check */}
      <motion.polyline
        strokeWidth={2}
        points="22 4 12 14.01 9 11.01"
        initial={{ scale: 0.4, pathLength: 1, pathOffset: 1 }}
        animate={{ scale: 1.0, pathLength: 1, pathOffset: 0 }}
        transition={{
          duration: 1.25,
          ease: 'easeInOut',
          repeat: 0,
          repeatType: 'mirror',
          repeatDelay: 0.2,
          // transitionDelay: 0.1,
        }}
      />
    </motion.svg>
  );
};
