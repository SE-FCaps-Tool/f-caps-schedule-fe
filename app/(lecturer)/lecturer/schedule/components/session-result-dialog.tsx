"use client";

import { useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLecturerSessionDetail, useSubmitLecturerSessionResult } from "@/hooks/lecturer/useLecturerPortal";
import type { ReviewResult, DefenseResult, SubmitSessionResultPayload } from "@/lib/api/services/fetchResults";
import { REVIEW_RESULT_META, DEFENSE_RESULT_META, ROUND_TYPE_LABEL } from "../../_shared/labels";
import { roundKind, type LecturerSession } from "./types";

function ReviewForm({ sessionId, onSaved }: { sessionId: string; onSaved: () => void }) {
  const submit = useSubmitLecturerSessionResult();
  const [result, setResult] = useState<ReviewResult | "">("");
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!result) return;
    const payload: SubmitSessionResultPayload = { result, note: note || undefined };
    submit.mutate({ sessionId, payload }, { onSuccess: onSaved });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Kết quả</Label>
        <Select value={result} onValueChange={(v) => v && setResult(v as ReviewResult)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn kết quả">
              {(v: ReviewResult) => REVIEW_RESULT_META[v].label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(REVIEW_RESULT_META) as ReviewResult[]).map((r) => (
              <SelectItem key={r} value={r}>
                {REVIEW_RESULT_META[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Ghi chú</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </div>
      <DialogFooter>
        <Button disabled={!result || submit.isPending} onClick={handleSubmit}>
          {submit.isPending ? "Đang lưu..." : "Lưu kết quả"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function DefenseForm({
  sessionId,
  council,
  onSaved,
}: {
  sessionId: string;
  council: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const submit = useSubmitLecturerSessionResult();
  const [result, setResult] = useState<DefenseResult | "">("");
  const [note, setNote] = useState("");
  const [deadline, setDeadline] = useState("");
  const [verifierId, setVerifierId] = useState("");

  const needsRemediation = result === "LEVEL_2";
  const canSave = result !== "" && (!needsRemediation || (deadline && verifierId));

  function handleSubmit() {
    if (!result || !canSave) return;
    const payload: SubmitSessionResultPayload = needsRemediation
      ? { result, note: note || undefined, remediation: { deadline, verifierId } }
      : { result, note: note || undefined };
    submit.mutate({ sessionId, payload }, { onSuccess: onSaved });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Kết luận</Label>
        <Select value={result} onValueChange={(v) => v && setResult(v as DefenseResult)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn kết luận">
              {(v: DefenseResult) => DEFENSE_RESULT_META[v].label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(DEFENSE_RESULT_META) as DefenseResult[]).map((r) => (
              <SelectItem key={r} value={r}>
                {DEFENSE_RESULT_META[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsRemediation && (
        <div className="space-y-3 rounded-lg border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-400/20 dark:bg-amber-500/5">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            Mức 2 bắt buộc hạn khắc phục và người xác nhận (spec §35/§74)
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="remediation-deadline" className="text-xs">Hạn khắc phục</Label>
            <Input
              id="remediation-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-9 bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Người xác nhận</Label>
            <Select value={verifierId} onValueChange={(v) => v && setVerifierId(v)}>
              <SelectTrigger className="h-9 w-full bg-background">
                <SelectValue placeholder="Chọn thành viên hội đồng">
                  {(id: string) => council.find((c) => c.id === id)?.name ?? id}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {council.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Ghi chú</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </div>
      <DialogFooter>
        <Button disabled={!canSave || submit.isPending} onClick={handleSubmit}>
          {submit.isPending ? "Đang lưu..." : "Lưu kết quả"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function SessionResultDialog({
  session,
  open,
  onOpenChange,
}: {
  session: LecturerSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: detail, isLoading, isError } = useLecturerSessionDetail(open ? session.id : null);
  const kind = roundKind(session.roundType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nhập kết quả</DialogTitle>
          <DialogDescription>
            {ROUND_TYPE_LABEL[session.roundType]} · {session.groupCode}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-2 py-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            Không tải được chi tiết phiên. Thử lại.
          </div>
        )}

        {detail && kind === "review" && (
          <ReviewForm sessionId={session.id} onSaved={() => onOpenChange(false)} />
        )}
        {detail && kind === "defense" && (
          <DefenseForm sessionId={session.id} council={detail.council} onSaved={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
