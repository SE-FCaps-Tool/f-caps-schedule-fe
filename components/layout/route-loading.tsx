import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type RouteLoadingVariant = "workspace" | "detail" | "form";

function WorkspaceLoading() {
  return (
    <div className="space-y-6 pt-2" aria-hidden>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function DetailLoading() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background" aria-hidden>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-5 w-52" />
        <Skeleton className="ml-auto h-8 w-24 rounded-md" />
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:flex-row lg:overflow-hidden lg:p-5">
        <aside className="shrink-0 space-y-4 lg:w-[280px]">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-44 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </aside>
        <main className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="min-h-[420px] w-full rounded-lg" />
        </main>
      </div>
    </div>
  );
}

function FormLoading() {
  return (
    <div className="mx-auto max-w-4xl pt-2" aria-hidden>
      <div className="space-y-5 rounded-lg border border-border p-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RouteLoading({ variant = "workspace", className }: { variant?: RouteLoadingVariant; className?: string }) {
  return (
    <div className={cn(className)}>
      {variant === "detail" && <DetailLoading />}
      {variant === "form" && <FormLoading />}
      {variant === "workspace" && <WorkspaceLoading />}
    </div>
  );
}
