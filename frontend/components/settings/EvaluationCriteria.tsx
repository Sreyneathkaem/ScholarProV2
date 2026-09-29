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
import { Switch } from "@/components/ui/switch";
import {
  getCriteriaList,
  toggleCriterion,
  createCriterion,
  updateCriterion,
} from "@/api/service/criteria.service";
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
  name: string;
  weight: number;
  isActive: boolean;
}

export default function EvaluationCriteria() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);

  const [editing, setEditing] = useState<Criterion | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    weight: "",
  });

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const res = await getCriteriaList();
      const data = Array.isArray(res) ? res : res?.data || [];
      setCriteria(data);
    } catch {
      toast.error("Failed to load criteria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const totalWeight = criteria
    .filter((c) => c.isActive)
    .reduce((sum, c) => sum + c.weight, 0);

  const activeCriteriaCount = criteria.filter((c) => c.isActive).length;
  const totalCriteriaCount = criteria.length;

  const handleSave = async () => {
    const name = formData.name.trim();
    const weight = Number(formData.weight);

    // Validate based on mode
    if (editing) {
      if (!weight) {
        toast.error("Weight is required");
        return;
      }
    } else {
      if (!name || !weight) {
        toast.error("All fields are required");
        return;
      }
    }

    if (weight <= 0 || weight > 100) {
      toast.error("Weight must be between 1 and 100");
      return;
    }

    const activeWeight = criteria
      .filter((c) => c.isActive && c.id !== editing?.id)
      .reduce((sum, c) => sum + c.weight, 0);

    if (activeWeight + weight > 200) {
      toast.error("Total active weight cannot exceed 100%");
      return;
    }

    try {
      if (editing) {
        await updateCriterion(editing.id, { name, weight });
        toast.success("Criterion updated");
      } else {
        await createCriterion({ name, weight, isActive: true });
        toast.success("Criterion created");
      }

      await fetchCriteria();
      setShowEditModal(false);
      setEditing(null);
      setFormData({ name: "", weight: "" });
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleToggle = async (criterion: Criterion) => {
    const activeWeight = criteria
      .filter((c) => c.isActive && c.id !== criterion.id)
      .reduce((sum, c) => sum + c.weight, 0);

    if (!criterion.isActive && activeWeight + criterion.weight > 100) {
      toast.error("Cannot activate. Total weight would exceed 100%");
      return;
    }

    try {
      await toggleCriterion(criterion.id, !criterion.isActive);
      await fetchCriteria();
    } catch {
      toast.error("Toggle failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Score Evaluation Presets</CardTitle>
            <CardDescription>
              Configure evaluation scoring weights
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormData({ name: "", weight: "" });
              setShowEditModal(true);
            }}
            className="bg-[#0F386C] text-white hover:bg-[#334155] cursor-pointer"
          >
            <Plus size={16} className="mr-2 text-white" />
            New Criteria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span
                className={
                  totalWeight === 100 ? "text-green-600" : "text-red-600"
                }
              >
                {totalWeight === 100
                  ? "Weights are balanced (100%)"
                  : "Total active weight must equal 100%"}
              </span>
              <span className="font-bold text-md">
                Active Total Weight : {totalWeight}%
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Active Criteria: {activeCriteriaCount} / {totalCriteriaCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {criteria.map((c) => (
        <Card key={c.id}>
          <CardContent className="flex justify-between items-center p-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{c.name}</h4>
                {c.isActive ? (
                  <span className="px-2 py-0.5 bg-[#0F386C] text-white text-xs rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                    Inactive
                  </span>
                )}
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
              <Switch
                checked={c.isActive}
                onCheckedChange={() => handleToggle(c)}
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={!c.isActive}
                onClick={() => {
                  if (!c.isActive) return;
                  setEditing(c);
                  setFormData({
                    name: c.name,
                    weight: c.weight.toString(),
                  });
                  setShowEditModal(true);
                }}
                className={!c.isActive ? "opacity-50 cursor-not-allowed" : ""}
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
              {editing ? "Edit Criteria" : "Create New Criteria"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 ">
            <div className="space-y-3">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
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
