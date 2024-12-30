'use client';

import { useAppAudio } from '@/state/app-audio-provider';
import { motion } from 'framer-motion';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AudioCountdownDialog() {
  const { isAudioCountdown, recordingCountdown } = useAppAudio();

  if (!isAudioCountdown) {
    return null;
  }

  return (
    <Dialog modal open>
      {/* <DialogTrigger asChild>
        <Button variant="outline">CTA</Button>
      </DialogTrigger> */}
      <DialogContent
        noCloseBtn
        className="border-none bg-transparent p-0 backdrop-blur-sm sm:max-w-[425px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Audio Recording Countdown</DialogTitle>
          {/* <DialogDescription>
            
          </DialogDescription> */}
        </DialogHeader>
        <div className="grid items-center justify-center gap-4 py-4">
          <div className="relative">
            <motion.span
              key={recordingCountdown}
              initial={{ opacity: 0.5, scale: 0.25 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.25 }}
              transition={
                {
                  // duration: 0.25,
                }
              }
              className="border-none text-9xl font-black"
            >
              {recordingCountdown}
            </motion.span>
          </div>
        </div>
        {/* <DialogFooter>
          <Button type="submit">Close</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
