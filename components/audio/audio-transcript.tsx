import { useEffect, useRef } from 'react';

import { Button } from '../ui/button';

interface Props {
  transcript: string;
}

export default function Transcript({ transcript }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportTXT = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    saveBlob(blob, 'transcript.txt');
  };

  // Scroll to the bottom when the component updates
  useEffect(() => {
    if (divRef.current) {
      const diff = Math.abs(
        divRef.current.offsetHeight +
          divRef.current.scrollTop -
          divRef.current.scrollHeight
      );

      if (diff <= 64) {
        // We're close enough to the bottom, so scroll to the bottom
        divRef.current.scrollTop = divRef.current.scrollHeight;
      }
    }
  });

  return (
    <div
      ref={divRef}
      className="my-2 flex max-h-[20rem] w-full flex-col overflow-y-auto p-4"
    >
      <div className="mb-2 flex w-full flex-row rounded-lg bg-white p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10">
        {transcript}
      </div>
      {transcript && (
        <div className="w-full text-right">
          <Button
            onClick={exportTXT}
            className="mr-2 inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-600 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            Export TXT
          </Button>
        </div>
      )}
    </div>
  );
}
