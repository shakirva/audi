export default function StatusBadge({ status }) {
  const styles = {
    Confirmed: "bg-green-100 text-green-800 border border-green-200",
    "Pending Payment": "bg-yellow-100 text-yellow-800 border border-yellow-200 pulse-badge",
    Enquiry: "bg-blue-100 text-blue-800 border border-blue-200",
    Completed: "bg-gray-100 text-gray-600 border border-gray-200",
    Cancelled: "bg-red-100 text-red-700 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
