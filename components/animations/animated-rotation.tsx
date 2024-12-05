import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

/**
 * Animated Success Check
 *
 * @resources
 *  - https://blog.noelcserepy.com/how-to-animate-svg-paths-with-framer-motion
 *  - https://codesandbox.io/s/path-examples-basic-qzpy35?from-embed=&file=/src/Example.jsx
 */

export const AnimatedRotation = ({ className }: { className?: string }) => {
  const transition = {
    duration: 4,
    yoyo: Number.POSITIVE_INFINITY,
    ease: 'easeInOut',
  };
  return (
    <div className="container">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        // width="451"
        // height="437"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 451 437"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('size-6 text-foreground', className)}
      >
        <motion.path
          d="M 239 17 C 142 17 48.5 103 48.5 213.5 C 48.5 324 126 408 244 408 C 362 408 412 319 412 213.5 C 412 108 334 68.5 244 68.5 C 154 68.5 102.68 135.079 99 213.5 C 95.32 291.921 157 350 231 345.5 C 305 341 357.5 290 357.5 219.5 C 357.5 149 314 121 244 121 C 174 121 151.5 167 151.5 213.5 C 151.5 260 176 286.5 224.5 286.5 C 273 286.5 296.5 253 296.5 218.5 C 296.5 184 270 177 244 177 C 218 177 197 198 197 218.5 C 197 239 206 250.5 225.5 250.5 C 245 250.5 253 242 253 218.5"
          fill="transparent"
          strokeWidth="12"
          stroke="currentColor"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            ...transition,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'mirror',
          }}
        />
      </svg>
      <motion.div
        className="box"
        initial={{ offsetDistance: '0%', scale: 2.5 }}
        animate={{ offsetDistance: '100%', scale: 1 }}
        transition={transition}
      />
    </div>
  );
};
