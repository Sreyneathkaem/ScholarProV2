"use client"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calculator, BookOpen, UserMinus } from "lucide-react"

interface StudentRemovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName: string
  mathStatus: string
  englishStatus: string
  onConfirm: (removalType: 'math' | 'english' | 'both') => void
  onCancel?: () => void
}

export function StudentRemovalDialog({
  open,
  onOpenChange,
  studentName,
  mathStatus,
  englishStatus,
  onConfirm,
  onCancel
}: StudentRemovalDialogProps) {
  const handleConfirm = (removalType: 'math' | 'english' | 'both') => {
    onConfirm(removalType)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const canRemoveFromMath = mathStatus === "Not Taken"
  const canRemoveFromEnglish = englishStatus === "Not Taken"
  const canRemoveFromBoth = canRemoveFromMath && canRemoveFromEnglish

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 border-0 shadow-xl">
        <div className="relative bg-card rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <UserMinus className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Remove Student from Exam
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose which exam(s) to remove <span className="font-medium text-foreground">{studentName}</span> from
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
            </Button>
          </div>

          {/* Current Status */}
          <div className="px-6 pt-4 pb-2">
            <h4 className="text-sm font-medium text-foreground mb-3">Current Status</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Math:</span>
                <span className={`text-sm font-medium ${mathStatus === "Exempt" ? "text-blue-600" : "text-orange-600"}`}>
                  {mathStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">English:</span>
                <span className={`text-sm font-medium ${englishStatus === "Exempt" ? "text-blue-600" : "text-orange-600"}`}>
                  {englishStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-3">
            {canRemoveFromMath && (
              <Button
                onClick={() => handleConfirm('math')}
                variant="outline"
                className="w-full h-14 justify-start text-left border-orange-200 hover:bg-row-hoverorange-50 hover:border-orange-300 group"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-500/15 rounded-lg flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-500/25">
                    <Calculator className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Remove from Math Exam</div>
                    <div className="text-xs text-muted-foreground">Student will only take the English exam</div>
                  </div>
                </div>
              </Button>
            )}

            {canRemoveFromEnglish && (
              <Button
                onClick={() => handleConfirm('english')}
                variant="outline"
                className="w-full h-14 justify-start text-left border-blue-200 hover:bg-row-hoverblue-50 hover:border-blue-300 group"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/15 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-500/25">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Remove from English Exam</div>
                    <div className="text-xs text-muted-foreground">Student will only take the Math exam</div>
                  </div>
                </div>
              </Button>
            )}

            {canRemoveFromBoth && (
              <Button
                onClick={() => handleConfirm('both')}
                className="w-full h-14 justify-start text-left bg-red-600 hover:bg-red-700 text-white group"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center group-hover:bg-red-600">
                    <UserMinus className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Remove from Both Exams</div>
                    <div className="text-xs text-red-100">Student will be excluded from all exams</div>
                  </div>
                </div>
              </Button>
            )}

            {!canRemoveFromMath && !canRemoveFromEnglish && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserMinus className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Student is exempt from both exams
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cannot remove exempt students from exams
                </p>
              </div>
            )}

            {/* Cancel Button */}
            <div className="pt-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="w-full text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
