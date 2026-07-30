"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  PackageSearch,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { searchPartsAction, selectPartAction } from "@/app/actions";
import { formatUsd } from "@/lib/format";
import type { Finding, PartOffer, PartSearch, RepairOrder } from "@/lib/types";
import { cn } from "@/lib/utils";

// Advisor-side parts sourcing. One click runs an automatic shopping search —
// the advisor never types a query. Backed by searchPartsAction, which never
// throws on data problems: a failed search still returns seeded offers with
// source: "fallback", so this panel always renders a usable list.

const LOADING_LABELS = [
  "Reading the finding…",
  "Searching vendors…",
  "Comparing prices…",
];
// Real searches run ~3-5s (AI query build, then the shopping call). Cached
// repeats return instantly, so the labels are driven by elapsed time rather
// than a fixed script.
const LABEL_INTERVAL_MS = 1300;

/** Vendor + delivery + optional rating, all freeform strings from the shopping feed. */
function OfferMeta({ offer }: { offer: PartOffer }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
      <span className="max-w-[14rem] truncate font-medium text-foreground/80">
        {offer.vendor}
      </span>
      <span aria-hidden>·</span>
      <span className="truncate">{offer.delivery}</span>
      {typeof offer.rating === "number" && (
        <>
          <span aria-hidden>·</span>
          <span className="tnum">{offer.rating.toFixed(1)}★</span>
        </>
      )}
    </span>
  );
}

/** Thumbnails are remote and frequently absent — the row must read fine without one. */
function Thumb({ offer }: { offer: PartOffer }) {
  const [failed, setFailed] = useState(false);
  if (!offer.thumbnail || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote shopping CDN hosts, not worth an allowlist
    <img
      src={offer.thumbnail}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-md border border-border bg-muted object-contain"
    />
  );
}

/** Compact summary of the part the advisor picked, shown on the finding row. */
function SelectedPartRow({
  finding,
  part,
  onClear,
}: {
  finding: Finding;
  part: PartOffer;
  onClear: () => void;
}) {
  const marginCents = finding.priceCents - part.priceCents;

  return (
    <div className="mt-2 rounded-lg border border-sev-green-border bg-sev-green-bg px-3 py-2">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-card text-sev-green-fg">
          <Check className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <a
            href={part.link}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-1 text-[13px] font-semibold hover:underline"
          >
            {part.title}
          </a>
          <OfferMeta offer={part} />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-right">
            <span className="tnum block text-[13px] font-semibold">
              {formatUsd(part.priceCents)}
            </span>
            {marginCents > 0 && (
              <span className="tnum block text-[11px] text-muted-foreground">
                {formatUsd(marginCents)} margin
              </span>
            )}
          </span>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Clear selected part"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PartsSourcing({
  order,
  finding,
}: {
  order: RepairOrder;
  finding: Finding;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState(0);
  const [search, setSearch] = useState<PartSearch | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      if (ticker.current) clearInterval(ticker.current);
    };
  }, []);

  const run = useCallback(async () => {
    setOpen(true);
    setSearch(null);
    setPending(true);
    setPhase(0);

    if (ticker.current) clearInterval(ticker.current);
    ticker.current = setInterval(() => {
      setPhase((p) => Math.min(p + 1, LOADING_LABELS.length - 1));
    }, LABEL_INTERVAL_MS);

    try {
      const res = await searchPartsAction(order.id, finding.id);
      if (!live.current) return;
      if (!res.ok || res.offers.length === 0) {
        toast.error("Couldn't source parts for this item.");
        setOpen(false);
        return;
      }
      setSearch({
        query: res.query,
        offers: res.offers,
        source: res.source,
      });
    } catch {
      if (!live.current) return;
      toast.error("Parts search is unavailable right now.");
      setOpen(false);
    } finally {
      if (ticker.current) clearInterval(ticker.current);
      if (live.current) setPending(false);
    }
  }, [order.id, finding.id]);

  const choose = useCallback(
    async (part: PartOffer | null) => {
      try {
        await selectPartAction(order.id, finding.id, part);
        if (part) {
          setOpen(false);
          toast.success(`Attached ${part.vendor} part to this finding`);
        }
      } catch {
        toast.error("Couldn't save that part.");
      }
    },
    [order.id, finding.id],
  );

  const selected = finding.selectedPart ?? null;

  return (
    <div className="mt-1">
      {selected ? (
        <Button size="sm" variant="ghost" onClick={run} disabled={pending}>
          <PackageSearch className="h-4 w-4" /> Change part
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={open ? () => setOpen(false) : run}
        >
          <PackageSearch className="h-4 w-4" />{" "}
          {open ? "Hide parts" : "Find parts"}
        </Button>
      )}

      {selected && (
        <SelectedPartRow
          finding={finding}
          part={selected}
          onClear={() => choose(null)}
        />
      )}

      {open && (
        <div className="mt-2 rounded-lg border border-border bg-muted/70">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="flex min-w-0 items-center gap-2 text-[12px] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  {LOADING_LABELS[phase]}
                </span>
              ) : (
                <span className="truncate">
                  Searched{" "}
                  <span className="text-foreground">
                    &ldquo;{search?.query}&rdquo;
                  </span>
                </span>
              )}
            </p>
            <span className="flex items-center gap-2">
              {!pending && search?.source === "fallback" && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Showing saved results
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </span>
          </div>

          {pending ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-md bg-secondary"
                  style={{ animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {search?.offers.map((offer) => {
                const isSelected = selected?.id === offer.id;
                return (
                  <li
                    key={offer.id}
                    className={cn(
                      "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 transition-colors duration-150 hover:bg-card",
                      isSelected && "bg-primary-soft",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumb offer={offer} />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[13px] font-medium leading-snug">
                          {offer.title}
                        </p>
                        <OfferMeta offer={offer} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="tnum text-[13px] font-semibold">
                        {formatUsd(offer.priceCents)}
                      </span>
                      <a
                        href={offer.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${offer.title} at ${offer.vendor}`}
                        className="rounded-md p-2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button
                        size="sm"
                        variant={isSelected ? "secondary" : "outline"}
                        onClick={() => choose(offer)}
                      >
                        {isSelected ? "Selected" : "Use this"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
