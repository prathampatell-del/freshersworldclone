interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'blue' | 'green' | 'red' | 'gray' | 'yellow';
  size?: 'sm' | 'md';
}

const variants = {
  orange: 'bg-orange-100 text-orange-700 border border-orange-200',
  blue: 'bg-blue-100 text-blue-700 border border-blue-200',
  green: 'bg-green-100 text-green-700 border border-green-200',
  red: 'bg-red-100 text-red-700 border border-red-200',
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  yellow: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
};

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      {children}
    </span>
  );
}

export function JobTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    fulltime: { label: 'Full Time', variant: 'blue' },
    internship: { label: 'Internship', variant: 'green' },
    walkin: { label: 'Walk-in', variant: 'orange' },
    govt: { label: 'Government', variant: 'yellow' },
  };
  const { label, variant } = map[type] || { label: type, variant: 'gray' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    pending: 'gray',
    reviewed: 'blue',
    shortlisted: 'green',
    rejected: 'red',
    hired: 'green',
  };
  return (
    <Badge variant={map[status] || 'gray'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
