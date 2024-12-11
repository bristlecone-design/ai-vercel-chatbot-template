import { memo, type FC } from 'react';
import Link from 'next/link';
import ReactMarkdown, { type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { isExternalUrl } from '@/lib/media/media-utils';
import { cn } from '@/lib/utils';

import { CodeBlock } from '../../ui/codeblock';

export type ReactMarkdownProps = Options & {
  linkClassName?: string;
};

export const MemoizedReactMarkdown: FC<ReactMarkdownProps> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
);

export const ReactMarkdownExtended: FC<ReactMarkdownProps> = ({
  children,
  className,
  linkClassName,
  ...props
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      {...props}
      className={cn(
        'prose prose-gray w-full break-words dark:prose-invert lg:prose-lg prose-p:leading-relaxed prose-pre:p-0 prose-img:rounded-md prose-img:border',
        'prose-h3:text-lg prose-h3:brightness-90 prose-h4:brightness-90 prose-blockquote:text-lg prose-blockquote:font-semibold prose-blockquote:leading-relaxed prose-blockquote:text-foreground/85 prose-lead:font-medium prose-lead:text-foreground/95 md:prose-blockquote:text-xl prose-h3:lg:text-xl prose-h3:lg:brightness-100',
        className
      )}
      components={{
        a({ node, children, ...props }) {
          const href = props.href as string;
          const isExternal = isExternalUrl(href);
          return isExternal ? (
            <a
              className={cn('link-primary', linkClassName)}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              href={href}
              {...props}
            >
              {children}
            </a>
          ) : (
            <Link className="link-primary" href={href} {...props}>
              {children}
            </Link>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        pre({ children }) {
          return <pre>{children}</pre>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="prose-blockquote">{children}</blockquote>
          );
        },
        code({ node, className, children, ...props }) {
          if (children && typeof children === 'string' && children.length) {
            if (children[0] === '▍') {
              return (
                <span className="mt-1 animate-pulse cursor-default">▍</span>
              );
            }

            // children[0] = (children[0] as string).replace('`▍`', '▍');
          }

          const match = /language-(\w+)/.exec(className || '');

          if (!match) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }

          return (
            <CodeBlock
              key={Math.random()}
              language={match?.[1] || ''}
              value={String(children).replace(/\n$/, '')}
              {...props}
            />
          );
        },
        h1: ({ node, children, ...props }) => {
          return (
            <h1 className="mb-2 mt-6 text-3xl font-semibold" {...props}>
              {children}
            </h1>
          );
        },
        h2: ({ node, children, ...props }) => {
          return (
            <h2 className="mb-2 mt-6 text-2xl font-semibold" {...props}>
              {children}
            </h2>
          );
        },
        h3: ({ node, children, ...props }) => {
          return (
            <h3 className="mb-2 mt-6 text-xl font-semibold" {...props}>
              {children}
            </h3>
          );
        },
        h4: ({ node, children, ...props }) => {
          return (
            <h4 className="mb-2 mt-6 text-lg font-semibold" {...props}>
              {children}
            </h4>
          );
        },
        h5: ({ node, children, ...props }) => {
          return (
            <h5 className="mb-2 mt-6 text-base font-semibold" {...props}>
              {children}
            </h5>
          );
        },
        h6: ({ node, children, ...props }) => {
          return (
            <h6 className="mb-2 mt-6 text-sm font-semibold" {...props}>
              {children}
            </h6>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
