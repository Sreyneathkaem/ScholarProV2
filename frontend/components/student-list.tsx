interface StudentListProps {
  students: Student[]
  className?: string
  showEmail?: boolean
  showStatus?: boolean
}

export function StudentList({ students, className, showEmail = true, showStatus = false }: StudentListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {students.map((student) => (
        <div key={student.id} className="grid grid-cols-3 gap-4 p-3 bg-muted rounded text-sm">
          <div>
            <div className="font-medium">{student.number}</div>
            <div className="text-muted-foreground">{student.nameEn}</div>
          </div>
          <div className="text-muted-foreground">
            {showEmail && student.email}
          </div>
          <div className="text-right">
            {showStatus && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {student.status}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}