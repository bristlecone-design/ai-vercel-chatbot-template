import { forwardRef, useRef, type FC, type ReactNode } from 'react';
import {
  EditorProvider,
  type EditorProviderProps,
  type JSONContent,
} from '@tiptap/react';
import { Provider } from 'jotai';
import tunnel from 'tunnel-rat';

import { editorStore } from '../editor-store';
import { EditorCommandTunnelContext } from './editor-command';

export interface EditorProps {
  readonly children: ReactNode;
  readonly className?: string;
}

interface EditorRootProps {
  readonly children: ReactNode;
}

export const EditorRoot: FC<EditorRootProps> = ({ children }) => {
  const tunnelInstance = useRef(tunnel()).current;

  return (
    <Provider store={editorStore}>
      <EditorCommandTunnelContext.Provider value={tunnelInstance}>
        {children}
      </EditorCommandTunnelContext.Provider>
    </Provider>
  );
};

export type EditorContentProps = Omit<EditorProviderProps, 'content'> & {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly initialContent?: JSONContent | string | null;
};

export const EditorContent = forwardRef<HTMLDivElement, EditorContentProps>(
  (
    { className, children, initialContent, immediatelyRender = false, ...rest },
    ref
  ) => (
    <div ref={ref} className={className}>
      <EditorProvider
        {...rest}
        content={initialContent}
        immediatelyRender={immediatelyRender}
      >
        {children}
      </EditorProvider>
    </div>
  )
);

EditorContent.displayName = 'EditorContent';
