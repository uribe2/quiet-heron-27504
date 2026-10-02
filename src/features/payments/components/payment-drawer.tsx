"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { usePayments } from "../use-payments";
import { getPayableInvoices } from "../logic";
import type { Payment } from "../types";
import type { PaymentFormValues } from "../schema";
import { PaymentForm } from "./payment-form";

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Payment being edited; omit to register a new one. */
  payment?: Payment;
  /** Preselected (and fixed) invoice, e.g. from the invoice detail page. */
  invoiceId?: string;
}

export function PaymentDrawer({ isOpen, onClose, payment, invoiceId }: PaymentDrawerProps) {
  const { t } = useTranslation();
  const { show } = useToast();
  const { data } = useData();
  const { createPayment, updatePayment } = usePayments();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const payable = getPayableInvoices(data.invoices, data.payments, getToday());
  const editedInvoice = payment ? data.invoices.find((i) => i.id === payment.invoiceId) : undefined;

  function requestClose() {
    if (isDirty) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  function handleSubmit(values: PaymentFormValues) {
    if (payment) {
      if (!updatePayment(payment.id, values)) return;
      show({ message: t("payments.savedToast") });
    } else {
      if (!createPayment(values)) return;
      show({ message: t("payments.createdToast") });
    }
    setIsDirty(false);
    onClose();
  }

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={requestClose}
        title={
          payment
            ? t("payments.drawerEditTitle", { number: editedInvoice?.number ?? "" })
            : t("payments.drawerCreateTitle")
        }
        closeLabel={t("payments.closeDrawer")}
        breadcrumbs={[{ label: t("payments.title"), href: "/payments" }]}
      >
        {isOpen ? (
          <PaymentForm
            payment={payment}
            invoices={payment && editedInvoice ? [editedInvoice] : payable}
            defaultInvoiceId={invoiceId}
            onSubmit={handleSubmit}
            onDirtyChange={setIsDirty}
          />
        ) : null}
      </Drawer>
      <ConfirmDialog
        isOpen={confirmingClose}
        onClose={() => setConfirmingClose(false)}
        onConfirm={() => {
          setIsDirty(false);
          onClose();
        }}
        title={t("clients.discardConfirmTitle")}
        description={t("clients.discardConfirmBody")}
        confirmLabel={t("clients.discardConfirmConfirm")}
        cancelLabel={t("clients.discardConfirmCancel")}
        destructive
      />
    </>
  );
}
