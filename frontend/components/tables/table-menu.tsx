import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { MoreVertical, Pen, Trash2 } from "lucide-react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/api";
import { toast } from "sonner";

import { ApiEndpointProps } from "@/api/endpoint";
import { useState } from "react";
import Link from "next/link";

import { useAuthStore } from "@/lib/stores/auth-store";

type TableMenuProps = {
  id: string;
  deleteEndpoint: ApiEndpointProps;
  invalidateKey: string;
  editPath?: string;
};

type BatchMenuProps = {
  id: string;
  editPath?: string;
};

export function TableMenu({
  id,
  deleteEndpoint,
  invalidateKey,
  editPath,
}: TableMenuProps) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isSelf = Boolean(currentUserId && String(currentUserId) === String(id));

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationKey: ["delete-item", deleteEndpoint, id],
    mutationFn: () => apiClient.delete(`${deleteEndpoint}/${id}`),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Deleted successfully");
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      setIsDeleteDialogOpen(false);
    },
    onError: (err: unknown) => {
      const apiError = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      const message =
        apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        "Delete failed";
      toast.error(message);
    },
  });

  const handleDelete = () => mutate();

  return (
    <div className="flex justify-end">
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"Delete Record"}</DialogTitle>
            <DialogDescription>
              {
                "Are you sure you want to delete this record? This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isPending}
            >
              {"Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {editPath && (
            <DropdownMenuItem asChild className="text-blue-500">
              <Link href={`/${editPath}/${id}`}>
                Edit
                <Pen className="ml-2 h-4 w-4" />
              </Link>
            </DropdownMenuItem>
          )}

          {!isSelf && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              {"Delete"}
              <Trash2 className="ml-2 h-4 w-4" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function BatchMenu({ id, editPath }: BatchMenuProps) {
  return (
    <div className="flex justify-end">
      {/* Delete confirmation dialog */}

      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {editPath && (
            <DropdownMenuItem asChild className="text-blue-500">
              <Link href={`/${editPath}/${id}`}>
                Edit
                <Pen className="ml-2 h-4 w-4" />
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
