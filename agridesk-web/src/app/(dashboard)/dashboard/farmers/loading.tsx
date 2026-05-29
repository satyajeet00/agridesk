import { Skeleton } from "@/components/ui/skeleton";

export default function FarmersLoading() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <div className="flex gap-3 justify-between">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
