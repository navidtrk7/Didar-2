"use client";

import { useEffect, useState } from "react";
import { DomainOverviewPage } from "@/components/domain-overview";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, Panel } from "@/components/ui";
import { ProductSubnav } from "@/components/product-subnav";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";

type Col = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string;
};

export default function ProductCollectionsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Col[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const load = async () => {
    if (!apiEnabled()) return;
    try {
      setRows((await didarApi.listCollections()) as Col[]);
    } catch (e) {
      setRows([]);
      toast(e instanceof Error ? e.message : "بارگذاری کالکشن‌ها ناموفق", "warn");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!name.trim()) {
      toast("نام کالکشن الزامی است", "warn");
      return;
    }
    try {
      await didarApi.createCollection(name.trim());
      await load();
      setOpen(false);
      setName("");
      toast("کالکشن ایجاد شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  return (
    <DomainOverviewPage
      domainId="product"
      title="کالکشن‌ها"
      description="دامنه محصول · موجودیت Collection جدا از رشتهٔ متنی روی SKU."
      actions={
        apiEnabled() ? (
          <Button onClick={() => setOpen(true)}>کالکشن جدید</Button>
        ) : undefined
      }
    >
      <ProductSubnav />
      {!apiEnabled() ? (
        <Panel className="mb-4 p-5 text-sm text-[var(--muted)]">
          با فعال‌سازی API، کالکشن‌ها از SKUها bootstrap می‌شوند.
        </Panel>
      ) : null}
      <DataTable
        headers={["نام", "slug", "وضعیت", "توضیح"]}
        rows={rows.map((c) => [
          c.name,
          <span key={c.id} data-ltr className="font-mono text-xs">
            {c.slug}
          </span>,
          <Badge key={`${c.id}-s`} tone="ok">
            {c.status}
          </Badge>,
          c.description,
        ])}
        empty="کالکشنی نیست."
      />
      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="کالکشن جدید"
        description="موجودیت دامنه Product."
        confirmLabel="ایجاد"
        onConfirm={() => void create()}
      >
        <Field label="نام">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      </ActionModal>
    </DomainOverviewPage>
  );
}
