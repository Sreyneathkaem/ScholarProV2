"use client";

export default function FiltersBar() {
  return (
    <div className="bg-card p-4 rounded-xl shadow-sm border flex items-center gap-3">
      {/* Search Input */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search by name, ID, or email..."
          className="w-full h-10 px-4 rounded-lg border text-sm focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* All Majors */}
      <select className="h-10 px-3 rounded-lg border bg-card text-sm">
        <option>All Majors</option>
        <option>Software Engineering</option>
        <option>Cybersecurity</option>
        <option>Cloud Computing</option>
        <option>Business Intelligence</option>
      </select>

      {/* All Status */}
      <select className="h-10 px-3 rounded-lg border bg-card text-sm">
        <option>All Status</option>
        <option>Under Review</option>
        <option>Shortlisted</option>
        <option>Exam Scheduled</option>
        <option>Awarded</option>
        <option>Rejected</option>
      </select>

      {/* All Batches */}
      <select className="h-10 px-3 rounded-lg border bg-card text-sm">
        <option>All Batches</option>
        <option>Batch 1</option>
        <option>Batch 2</option>
        <option>Batch 3</option>
      </select>
    </div>
  );
}
