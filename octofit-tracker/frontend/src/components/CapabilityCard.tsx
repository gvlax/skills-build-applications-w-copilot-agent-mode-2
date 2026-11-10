import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  error?: string | null;
};

export function CapabilityCard({ title, description, children, isLoading = false, isEmpty = false, emptyText = 'No data available.', error = null }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {isLoading ? (
          <p role="status">Loading...</p>
        ) : error ? (
          <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
        ) : isEmpty ? (
          <p>{emptyText}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
