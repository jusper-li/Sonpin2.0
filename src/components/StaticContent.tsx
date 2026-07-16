import { Fragment } from 'react';

const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

export const hasHtmlContent = (value: string) => HTML_PATTERN.test(value);

interface StaticContentProps {
  value: string;
  className?: string;
}

export default function StaticContent({ value, className = '' }: StaticContentProps) {
  if (hasHtmlContent(value)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: value }} />;
  }

  return (
    <div className={className}>
      {value.split('\n').map((line, index, lines) => (
        <Fragment key={`${index}-${line}`}>
          {line}
          {index < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </div>
  );
}
