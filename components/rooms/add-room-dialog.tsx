"use client";

import { useState } from "react";
import { DoorOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRoom } from "@/hooks/useRooms";

export function AddRoomDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("40");
  const { mutate, isPending } = useCreateRoom();

  const canSave = code.trim().length > 0 && name.trim().length > 1 && Number(capacity) > 0 && Number(capacity) <= 500;

  function handleSave() {
    if (!canSave) return;
    mutate(
      { code: code.trim(), name: name.trim(), capacity: Number(capacity) },
      {
        onSuccess: () => {
          setOpen(false);
          setCode("");
          setName("");
          setCapacity("40");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm"><DoorOpen />Thêm phòng</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm phòng</DialogTitle>
          <DialogDescription>Mã phòng phải là duy nhất trong toàn hệ thống.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="room-code">Mã phòng</Label>
            <Input id="room-code" placeholder="A203" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-name">Tên phòng</Label>
            <Input id="room-name" placeholder="Phòng học A203" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-capacity">Sức chứa</Label>
            <Input
              id="room-capacity"
              type="number"
              min={1}
              max={500}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isPending}>
            {isPending ? "Đang thêm..." : "Thêm phòng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
