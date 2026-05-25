import AssignmentDetailClient from './AssignmentDetailClient';

/** No IDs at build time; assignment data is loaded client-side from the API. */
export function generateStaticParams() {
  return [];
}

export default function AssignmentDetailPage() {
  return <AssignmentDetailClient />;
}
