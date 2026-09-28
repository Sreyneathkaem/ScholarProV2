"use client";

import BatchListClient from "@/components/batch/batch-list";
import { NewBatch } from "@/components/batch/new-batch";
import { useHeader } from "@/components/header/header-context";
import { PageHero } from "@/components/common/page-hero";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Batch() {
  const { setTitle } = useHeader();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleBatchCreated = () => {
    console.log("✅ Batch created - refreshing data");
  };

  useEffect(() => {
    setTitle("Batch Management");
  }, [setTitle]);

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <PageHero
        title="Batch Management"
        subtitle="Administer intake cohorts, application cycles, and academic terms"
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-sm h-9 px-4 rounded-[6px] text-xs font-medium cursor-pointer"
          >
            <Plus size={14} className="mr-1.5" />
            New Batch
          </Button>
        }
      />

      <NewBatch
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onBatchCreated={handleBatchCreated}
      />

      <BatchListClient />
    </div>
  );
}
