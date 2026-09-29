"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getsubjectList,
  createSubject,
  updateSubject,
} from "@/api/service/subject.service";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";

interface Criterion {
  id: number;
  subjectName: string;
  weight: number;
  isActive: boolean;
}

export default function SubjectCriteria() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);

  const [editing, setEditing] = useState<Criterion | null>(null);

  const [formData, setFormData] = useState({
    subjectName: "",
    weight: "",
  });

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const res = await getsubjectList();
      const data = Array.isArray(res) ? res : res?.data || [];
      setCriteria(data);
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleSave = async () => {
    const subjectName = formData.subjectName.trim();
    const weight = Number(formData.weight);

    // Validate based on mode
    if (editing) {
      if (!weight) {
        toast.error("Weight is required");
        return;
      }
    } else {
      if (!subjectName || !weight) {
        toast.error("All fields are required");
        return;
      }
    }

    if (weight <= 0 || weight > 100) {
      toast.error("Weight must be between 1 and 100");
      return;
    }

    try {
      if (editing) {
        await updateSubject(editing.id, { subjectName, weight });
        toast.success("Subject updated");
      } else {
        await createSubject({ subjectName, weight, isActive: true });
        toast.success("Subject created");
      }

      await fetchCriteria();
      setShowEditModal(false);
      setEditing(null);
      setFormData({ subjectName: "", weight: "" });
    } catch {
      toast.error("Operation failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Score Exam Subject Presets</CardTitle>
            <CardDescription>
              Configure evaluation scoring weights
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormData({ subjectName: "", weight: "" });
              setShowEditModal(true);
            }}
            className="bg-[#0F386C] text-white hover:bg-[#334155] cursor-pointer"
          >
            <Plus size={16} className="mr-2 text-white" />
            New Subject
          </Button>
        </CardHeader>
      </Card>

      {criteria.map((c) => (
        <Card key={c.id}>
          <CardContent className="flex justify-between items-center p-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{c.subjectName}</h4>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Weight:{" "}
                  <span className="font-semibold text-foreground">
                    {c.weight}%
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(c);
                  setFormData({
                    subjectName: c.subjectName,
                    weight: c.weight.toString(),
                  });
                  setShowEditModal(true);
                }}
              >
                <Edit2 size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Subject" : "Create New Subject"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 ">
            <div className="space-y-3">
              <Label>Subject Name</Label>
              <Input
                value={formData.subjectName}
                onChange={(e) =>
                  setFormData({ ...formData, subjectName: e.target.value })
                }
                disabled={editing !== null}
                className={
                  editing !== null ? "bg-muted cursor-not-allowed" : ""
                }
              />
              {editing && (
                <p className="text-xs text-muted-foreground">
                  Name cannot be changed when editing
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Weight (%)</Label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#0F386C] text-white hover:bg-[#334155] cursor-pointer"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
