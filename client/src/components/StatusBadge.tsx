interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normStatus = status.toLowerCase();
  
  let bgColors = 'bg-gray-100 text-gray-800';
  
  if (normStatus === 'active' || normStatus === 'approved') {
    bgColors = 'bg-green-100 text-green-800';
  } else if (normStatus === 'pending') {
    bgColors = 'bg-yellow-100 text-yellow-800';
  } else if (normStatus === 'cancelled' || normStatus === 'rejected') {
    bgColors = 'bg-red-100 text-red-800';
  } else if (normStatus === 'expired') {
    bgColors = 'bg-gray-200 text-gray-700';
  }

  return (
    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${bgColors} capitalize`}>
      {status}
    </span>
  );
}
