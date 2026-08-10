import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { EmptyHint, Panel } from "./ui";

export function DataTable({
  headers,
  children,
  rows,
  className,
  caption,
  empty,
}: {
  headers: string[];
  children?: ReactNode;
  rows?: ReactNode[][];
  className?: string;
  caption?: string;
  empty?: ReactNode;
}) {
  const hasRows = Boolean(rows?.length) || Boolean(children);

  if (!hasRows) {
    return (
      <EmptyHint>
        {empty ?? "موردی برای نمایش وجود ندارد."}
      </EmptyHint>
    );
  }

  // Wide tables scroll; narrow ones must fit the card (RTL was clipping the end column).
  const wide = headers.length >= 6;

  return (
    <Panel className={cn("min-w-0", className)}>
      <div
        className={cn(
          "min-w-0 rounded-[inherit]",
          wide ? "overflow-x-auto overscroll-x-contain" : "overflow-x-visible",
        )}
      >
        <table
          className={cn(
            "w-full text-start text-sm",
            wide && "min-w-[36rem]",
          )}
        >
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--mist)]/80">
              {headers.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-3 py-3 text-[11px] font-semibold tracking-wide whitespace-nowrap text-[var(--muted)] sm:px-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] [&_tr]:transition-colors [&_tr:hover]:bg-[var(--ink)]/[0.025]">
            {children}
            {rows?.map((cells, i) => (
              <tr key={i}>
                {cells.map((cell, j) => (
                  <td
                    key={j}
                    className="max-w-[12rem] px-3 py-3 align-middle break-words sm:max-w-none sm:px-4"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
