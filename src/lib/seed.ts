import type { AppData } from "./app-data";
import { addDays, getToday, getNowISO } from "./dates";
import type { Client } from "@/features/clients/types";
import type { Interaction } from "@/features/interactions/types";
import type { Opportunity } from "@/features/pipeline/types";
import type { Project } from "@/features/projects/types";
import type { Deliverable } from "@/features/deliverables/types";
import type { TimeEntry } from "@/features/time/types";
import type { Quote } from "@/features/quotes/types";
import type { Invoice } from "@/features/invoices/types";
import type { Payment } from "@/features/payments/types";
import type { Meeting } from "@/features/meetings/types";
import type { DocumentRecord } from "@/features/documents/types";
import type { AIConversation } from "@/features/ai/types";

/**
 * Seed data is generated relative to today() so alerts, "vence hoy", etc.
 * always line up. IDs are literal strings (not crypto.randomUUID()) so the
 * cross-references below stay readable.
 */
export function createSeedData(): AppData {
  const now = getNowISO();
  const today = getToday();
  const base = { createdAt: now, updatedAt: now };

  const clients: Client[] = [
    {
      ...base,
      id: "c-acme",
      name: "Acme Corp",
      type: "company",
      email: "contacto@acme.com",
      phone: "+1 555 0101",
      website: "https://acme.com",
      city: "Bogotá",
      country: "Colombia",
      contacts: [
        { id: "ct-acme-1", name: "Laura Méndez", role: "Marketing Lead", email: "laura@acme.com", isPrimary: true },
      ],
      tags: ["branding", "web"],
      source: "referral",
      status: "active",
    },
    {
      ...base,
      id: "c-techcorp",
      name: "TechCorp",
      type: "company",
      email: "hello@techcorp.io",
      city: "Medellín",
      country: "Colombia",
      contacts: [
        { id: "ct-techcorp-1", name: "Daniel Ruiz", role: "CTO", email: "daniel@techcorp.io", isPrimary: true },
      ],
      tags: ["ecommerce"],
      source: "website",
      status: "active",
    },
    {
      ...base,
      id: "c-startupx",
      name: "StartupX Inc.",
      type: "company",
      email: "team@startupx.io",
      city: "Austin",
      country: "USA",
      contacts: [
        { id: "ct-startupx-1", name: "Priya Shah", role: "Product Lead", email: "priya@startupx.io", isPrimary: true },
      ],
      tags: ["mobile", "mvp"],
      source: "social",
      status: "active",
    },
    {
      ...base,
      id: "c-globalretail",
      name: "Global Retail",
      type: "company",
      email: "marketing@globalretail.com",
      city: "Ciudad de México",
      country: "México",
      contacts: [
        { id: "ct-globalretail-1", name: "Carlos Núñez", role: "Marketing Director", email: "carlos@globalretail.com", isPrimary: true },
      ],
      tags: ["campaña", "retail"],
      source: "marketplace",
      status: "active",
    },
    {
      ...base,
      id: "c-wayne",
      name: "Wayne Enterprises",
      type: "company",
      email: "billing@wayne.com",
      city: "Gotham",
      country: "USA",
      contacts: [
        { id: "ct-wayne-1", name: "Lucius Fox", role: "Finance", email: "lucius@wayne.com", isPrimary: true },
      ],
      tags: ["enterprise"],
      source: "referral",
      status: "active",
    },
    {
      ...base,
      id: "c-stark",
      name: "Stark Industries",
      type: "company",
      email: "contact@stark.com",
      city: "Malibu",
      country: "USA",
      contacts: [
        { id: "ct-stark-1", name: "Pepper Potts", role: "COO", email: "pepper@stark.com", isPrimary: true },
      ],
      tags: ["enterprise", "branding"],
      source: "other",
      status: "active",
    },
    {
      ...base,
      id: "c-pixel",
      name: "Studio Pixel",
      type: "company",
      email: "hola@studiopixel.co",
      city: "Cali",
      country: "Colombia",
      contacts: [
        { id: "ct-pixel-1", name: "María González", role: "Founder", email: "maria@studiopixel.co", isPrimary: true },
      ],
      tags: ["diseño"],
      source: "social",
      status: "active",
    },
    {
      ...base,
      id: "c-nova",
      name: "Nova Labs",
      type: "company",
      email: "info@novalabs.dev",
      city: "Bogotá",
      country: "Colombia",
      contacts: [
        { id: "ct-nova-1", name: "Felipe Ortiz", role: "Founder", email: "felipe@novalabs.dev", isPrimary: true },
      ],
      tags: ["branding"],
      source: "website",
      status: "active",
    },
    {
      ...base,
      id: "c-globex",
      name: "Globex",
      type: "company",
      email: "info@globex.com",
      city: "Springfield",
      country: "USA",
      contacts: [],
      tags: [],
      source: "other",
      status: "archived",
    },
  ];

  const opportunities: Opportunity[] = [
    { ...base, id: "o-1", clientId: "c-nova", title: "Rebranding de logo", estimatedValueCents: 150000, stage: "contact", status: "open", expectedCloseDate: addDays(today, 20), position: 0 },
    { ...base, id: "o-2", clientId: "c-pixel", title: "Consultoría SEO", estimatedValueCents: 120000, stage: "contact", status: "open", expectedCloseDate: addDays(today, 15), position: 1 },
    { ...base, id: "o-3", clientId: "c-techcorp", title: "App ecommerce", estimatedValueCents: 350000, stage: "quote", status: "open", expectedCloseDate: addDays(today, 10), position: 0, quoteId: "q-2" },
    { ...base, id: "o-4", clientId: "c-startupx", title: "Rediseño app móvil", estimatedValueCents: 800000, stage: "project", status: "open", expectedCloseDate: addDays(today, 30), position: 0, projectId: "p-4" },
    { ...base, id: "o-5", clientId: "c-globalretail", title: "Campaña Q4", estimatedValueCents: 240000, stage: "project", status: "open", expectedCloseDate: addDays(today, 5), position: 1, projectId: "p-3" },
    { ...base, id: "o-6", clientId: "c-acme", title: "Web Acme Corp", estimatedValueCents: 450000, stage: "delivery", status: "open", expectedCloseDate: addDays(today, 7), position: 0, projectId: "p-1" },
    { ...base, id: "o-7", clientId: "c-wayne", title: "Soporte mensual", estimatedValueCents: 90000, stage: "collection", status: "open", expectedCloseDate: addDays(today, -5), position: 0 },
    { ...base, id: "o-8", clientId: "c-stark", title: "Auditoría de marca", estimatedValueCents: 200000, stage: "contact", status: "open", expectedCloseDate: addDays(today, 25), position: 2 },
    { ...base, id: "o-9", clientId: "c-techcorp", title: "Catálogo de productos", estimatedValueCents: 300000, stage: "collection", status: "won", position: 2, quoteId: "q-3", projectId: "p-5" },
    { ...base, id: "o-10", clientId: "c-pixel", title: "Identidad de marca", estimatedValueCents: 100000, stage: "contact", status: "lost", lostReason: "price", position: 3 },
  ];

  const quoteItemsStark = [
    { id: "li-q1-1", description: "Diagnóstico de marca", quantity: 1, unitPriceCents: 80000 },
    { id: "li-q1-2", description: "Taller de posicionamiento", quantity: 2, unitPriceCents: 60000 },
  ];
  const quoteItemsTechcorp = [
    { id: "li-q3-1", description: "Diseño de catálogo", quantity: 1, unitPriceCents: 150000 },
    { id: "li-q3-2", description: "Desarrollo del catálogo", quantity: 1, unitPriceCents: 150000 },
  ];
  const quoteItemsPixel = [
    { id: "li-q4-1", description: "Identidad visual completa", quantity: 1, unitPriceCents: 100000 },
  ];

  const quotes: Quote[] = [
    {
      ...base,
      id: "q-1",
      number: `COT-${today.slice(0, 4)}-001`,
      clientId: "c-stark",
      opportunityId: "o-8",
      title: "Auditoría de marca",
      items: quoteItemsStark,
      taxRate: 0,
      paymentTerms: "50% anticipo, 50% contra entrega",
      validUntil: addDays(today, 15),
      status: "draft",
      history: [{ at: now, action: "created" }],
    },
    {
      ...base,
      id: "q-2",
      number: `COT-${today.slice(0, 4)}-002`,
      clientId: "c-techcorp",
      opportunityId: "o-3",
      title: "App ecommerce",
      items: quoteItemsTechcorp,
      taxRate: 0,
      paymentTerms: "50% anticipo, 50% contra entrega",
      validUntil: addDays(today, 6),
      status: "sent",
      history: [
        { at: addDays(today, -9) + "T09:00:00.000Z", action: "created" },
        { at: addDays(today, -9) + "T09:05:00.000Z", action: "sent" },
      ],
    },
    {
      ...base,
      id: "q-3",
      number: `COT-${today.slice(0, 4)}-003`,
      clientId: "c-techcorp",
      opportunityId: "o-9",
      title: "Catálogo de productos",
      items: quoteItemsTechcorp,
      taxRate: 0,
      paymentTerms: "100% contra entrega",
      validUntil: addDays(today, -20),
      status: "accepted",
      projectId: "p-5",
      history: [
        { at: addDays(today, -40) + "T09:00:00.000Z", action: "created" },
        { at: addDays(today, -38) + "T09:00:00.000Z", action: "sent" },
        { at: addDays(today, -35) + "T09:00:00.000Z", action: "accepted" },
        { at: addDays(today, -35) + "T09:10:00.000Z", action: "converted" },
      ],
    },
    {
      ...base,
      id: "q-4",
      number: `COT-${today.slice(0, 4)}-004`,
      clientId: "c-pixel",
      opportunityId: "o-10",
      title: "Identidad de marca",
      items: quoteItemsPixel,
      taxRate: 0,
      paymentTerms: "100% anticipo",
      validUntil: addDays(today, -10),
      status: "rejected",
      history: [
        { at: addDays(today, -18) + "T09:00:00.000Z", action: "created" },
        { at: addDays(today, -17) + "T09:00:00.000Z", action: "sent" },
        { at: addDays(today, -12) + "T09:00:00.000Z", action: "rejected" },
      ],
    },
  ];

  const projects: Project[] = [
    { ...base, id: "p-1", clientId: "c-acme", name: "Rediseño web Acme", billingType: "fixed", budgetCents: 500000, startDate: addDays(today, -45), dueDate: addDays(today, 20), status: "active" },
    { ...base, id: "p-2", clientId: "c-nova", name: "Manual de marca", billingType: "hourly", hourlyRateCents: 8500, startDate: addDays(today, -20), dueDate: addDays(today, 30), status: "active" },
    { ...base, id: "p-3", clientId: "c-globalretail", name: "Campaña Q4 Global Retail", billingType: "fixed", budgetCents: 240000, startDate: addDays(today, -30), dueDate: today, status: "active" },
    { ...base, id: "p-4", clientId: "c-startupx", name: "Rediseño app móvil StartupX", billingType: "hourly", hourlyRateCents: 9500, startDate: addDays(today, -5), dueDate: addDays(today, 45), status: "active" },
    { ...base, id: "p-5", clientId: "c-techcorp", name: "Catálogo de productos", quoteId: "q-3", billingType: "fixed", budgetCents: 300000, startDate: addDays(today, -35), dueDate: addDays(today, -5), status: "completed" },
  ];

  const deliverables: Deliverable[] = [
    { ...base, id: "d-1", projectId: "p-1", title: "Diseño de marca", dueDate: addDays(today, -15), status: "delivered", order: 0, deliveredAt: addDays(today, -16) + "T15:00:00.000Z" },
    { ...base, id: "d-2", projectId: "p-1", title: "Desarrollo frontend", dueDate: addDays(today, -2), status: "delivered", order: 1, deliveredAt: addDays(today, -3) + "T15:00:00.000Z" },
    { ...base, id: "d-3", projectId: "p-1", title: "QA y ajustes finales", dueDate: addDays(today, 10), status: "in_progress", order: 2 },
    { ...base, id: "d-4", projectId: "p-2", title: "Investigación de marca", dueDate: addDays(today, -10), status: "delivered", order: 0, deliveredAt: addDays(today, -11) + "T15:00:00.000Z" },
    { ...base, id: "d-5", projectId: "p-2", title: "Guía de estilo", dueDate: addDays(today, 12), status: "pending", order: 1 },
    { ...base, id: "d-6", projectId: "p-2", title: "Aplicaciones de marca", dueDate: addDays(today, 25), status: "pending", order: 2 },
    { ...base, id: "d-7", projectId: "p-3", title: "Piezas para redes", dueDate: addDays(today, -20), status: "delivered", order: 0, deliveredAt: addDays(today, -21) + "T15:00:00.000Z" },
    { ...base, id: "d-8", projectId: "p-3", title: "Landing de campaña", dueDate: addDays(today, -10), status: "delivered", order: 1, deliveredAt: addDays(today, -11) + "T15:00:00.000Z" },
    { ...base, id: "d-9", projectId: "p-3", title: "Pauta digital", dueDate: addDays(today, -4), status: "delivered", order: 2, deliveredAt: addDays(today, -5) + "T15:00:00.000Z" },
    { ...base, id: "d-10", projectId: "p-3", title: "Informe de resultados", dueDate: addDays(today, -3), status: "pending", order: 3 },
    { ...base, id: "d-11", projectId: "p-4", title: "Wireframes de inicio", dueDate: today, status: "pending", order: 0 },
    { ...base, id: "d-12", projectId: "p-4", title: "Revisión de textos", dueDate: addDays(today, 1), status: "pending", order: 1 },
    { ...base, id: "d-13", projectId: "p-4", title: "Prototipo navegable", dueDate: addDays(today, 18), status: "pending", order: 2 },
    { ...base, id: "d-14", projectId: "p-5", title: "Entrega de catálogo", dueDate: addDays(today, -6), status: "delivered", order: 0, deliveredAt: addDays(today, -6) + "T15:00:00.000Z" },
  ];

  const timeEntries: TimeEntry[] = [];
  const timeProjects: { projectId: string; deliverableId?: string; billable: boolean; description: string }[] = [
    { projectId: "p-2", deliverableId: "d-4", billable: true, description: "Investigación de referentes" },
    { projectId: "p-2", deliverableId: "d-5", billable: true, description: "Paleta de color y tipografía" },
    { projectId: "p-4", deliverableId: "d-11", billable: true, description: "Wireframes de la pantalla de inicio" },
    { projectId: "p-4", deliverableId: "d-12", billable: true, description: "Revisión de textos con el cliente" },
    { projectId: "p-1", billable: false, description: "QA interno del sitio" },
    { projectId: "p-3", billable: false, description: "Ajustes de pauta digital" },
  ];
  for (let i = 0; i < 18; i++) {
    const spec = timeProjects[i % timeProjects.length];
    // From yesterday back two weeks, so no seeded entry ends later than "now".
    const day = addDays(today, -(i % 14) - 1);
    const duration = 60 + (i % 4) * 30;
    // 13:00–16:00 UTC = 8–11 a.m. in Colombia (UTC-5), like the other seeded datetimes.
    const startHour = 13 + (i % 4);
    const endMinutes = startHour * 60 + duration;
    timeEntries.push({
      ...base,
      id: `t-${i + 1}`,
      projectId: spec.projectId,
      deliverableId: spec.deliverableId,
      description: spec.description,
      startedAt: `${day}T${String(startHour).padStart(2, "0")}:00:00.000Z`,
      endedAt: `${day}T${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}:00.000Z`,
      durationMinutes: duration,
      billable: spec.billable,
      invoiceId: i < 3 ? "inv-1041" : undefined,
    });
  }

  const invoiceItemsAcme = [
    { id: "li-inv1-1", description: "Diseño de marca", quantity: 1, unitPriceCents: 250000 },
    { id: "li-inv1-2", description: "Desarrollo frontend", quantity: 1, unitPriceCents: 250000 },
  ];
  const invoiceItemsWayne = [
    { id: "li-inv2-1", description: "Soporte mensual (bolsa de horas)", quantity: 10, unitPriceCents: 9000 },
  ];
  const invoiceItemsStark = [
    { id: "li-inv3-1", description: "Diagnóstico de marca", quantity: 1, unitPriceCents: 80000 },
  ];
  const invoiceItemsNova = [
    { id: "li-inv4-1", description: "Investigación de marca", quantity: 1, unitPriceCents: 85000 },
  ];
  const invoiceItemsGlobalRetail = [
    { id: "li-inv5-1", description: "Campaña Q4 - entregables", quantity: 1, unitPriceCents: 240000 },
  ];

  const invoices: Invoice[] = [
    { ...base, id: "inv-1041", number: "FAC-1041", clientId: "c-acme", projectId: "p-1", issueDate: addDays(today, -40), dueDate: addDays(today, -25), items: invoiceItemsAcme, taxRate: 0, status: "paid" },
    { ...base, id: "inv-1042", number: "FAC-1042", clientId: "c-wayne", issueDate: addDays(today, -38), dueDate: addDays(today, -23), items: invoiceItemsWayne, taxRate: 0, status: "sent" },
    { ...base, id: "inv-1043", number: "FAC-1043", clientId: "c-stark", quoteId: "q-1", issueDate: addDays(today, -2), dueDate: addDays(today, 13), items: invoiceItemsStark, taxRate: 0, status: "sent" },
    { ...base, id: "inv-1044", number: "FAC-1044", clientId: "c-nova", projectId: "p-2", issueDate: today, dueDate: addDays(today, 15), items: invoiceItemsNova, taxRate: 0, status: "draft" },
    { ...base, id: "inv-1045", number: "FAC-1045", clientId: "c-globalretail", projectId: "p-3", issueDate: addDays(today, -10), dueDate: addDays(today, 5), items: invoiceItemsGlobalRetail, taxRate: 0, status: "sent" },
  ];

  const payments: Payment[] = [
    { ...base, id: "pay-1", invoiceId: "inv-1041", amountCents: 500000, date: addDays(today, -26), method: "transfer", reference: "TRX-001" },
    { ...base, id: "pay-2", invoiceId: "inv-1045", amountCents: 100000, date: addDays(today, -6), method: "transfer", reference: "TRX-002" },
    { ...base, id: "pay-3", invoiceId: "inv-1045", amountCents: 60000, date: addDays(today, -1), method: "card" },
  ];

  const meetings: Meeting[] = [
    { ...base, id: "m-1", title: "Kickoff campaña Q4", clientId: "c-globalretail", projectId: "p-3", startsAt: `${addDays(today, 3)}T15:00:00.000Z`, durationMinutes: 45, mode: "video", locationOrLink: "https://meet.example.com/q4-kickoff", status: "scheduled" },
    { ...base, id: "m-2", title: "Revisión de catálogo", clientId: "c-techcorp", startsAt: `${addDays(today, 6)}T17:00:00.000Z`, durationMinutes: 30, mode: "call", status: "scheduled" },
    { ...base, id: "m-3", title: "Entrega de wireframes", clientId: "c-startupx", projectId: "p-4", startsAt: `${addDays(today, -5)}T16:00:00.000Z`, durationMinutes: 60, mode: "in_person", locationOrLink: "Oficina StartupX", notes: "Cliente aprobó el flujo principal.", status: "done" },
    { ...base, id: "m-4", title: "Seguimiento soporte", clientId: "c-wayne", startsAt: `${addDays(today, -3)}T14:00:00.000Z`, durationMinutes: 30, mode: "call", status: "cancelled" },
  ];

  const documents: DocumentRecord[] = [
    { ...base, id: "doc-1", name: "Contrato Acme", kind: "contract", clientId: "c-acme", projectId: "p-1", source: { type: "file", fileName: "contrato-acme.pdf", mimeType: "application/pdf", sizeBytes: 420000 }, tags: ["legal"] },
    { ...base, id: "doc-2", name: "Propuesta TechCorp", kind: "proposal", clientId: "c-techcorp", source: { type: "link", url: "https://drive.example.com/propuesta-techcorp" }, tags: ["propuesta"] },
    { ...base, id: "doc-3", name: "Brief StartupX", kind: "brief", clientId: "c-startupx", projectId: "p-4", source: { type: "file", fileName: "brief-startupx.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeBytes: 150000 }, tags: ["brief"] },
    { ...base, id: "doc-4", name: "Factura Wayne FAC-1042", kind: "invoice", clientId: "c-wayne", source: { type: "link", url: "https://drive.example.com/fac-1042" }, tags: [] },
    { ...base, id: "doc-5", name: "Entregable manual de marca", kind: "deliverable", clientId: "c-nova", projectId: "p-2", source: { type: "file", fileName: "manual-marca.pdf", mimeType: "application/pdf", sizeBytes: 980000 }, tags: ["marca"] },
    { ...base, id: "doc-6", name: "Notas auditoría Stark", kind: "other", clientId: "c-stark", source: { type: "link", url: "https://drive.example.com/notas-stark" }, tags: [] },
  ];

  const interactions: Interaction[] = [
    { ...base, id: "i-1", clientId: "c-acme", channel: "email", occurredAt: `${addDays(today, -1)}T10:00:00.000Z`, summary: "Confirmó los ajustes finales del sitio web.", sentiment: "positive", followUpDone: false },
    { ...base, id: "i-2", clientId: "c-techcorp", channel: "whatsapp", occurredAt: `${addDays(today, -1)}T16:00:00.000Z`, summary: "Cliente reportó inconformidad con el avance del catálogo.", sentiment: "negative", followUpDate: today, followUpDone: false },
    { ...base, id: "i-3", clientId: "c-startupx", channel: "call", occurredAt: `${addDays(today, -4)}T11:00:00.000Z`, summary: "Llamada de seguimiento sobre wireframes.", sentiment: "neutral", followUpDone: true },
    { ...base, id: "i-4", clientId: "c-globalretail", channel: "meeting", meetingId: "m-3", occurredAt: `${addDays(today, -5)}T16:00:00.000Z`, summary: "Reunión de revisión de campaña.", sentiment: "positive", followUpDone: true },
    { ...base, id: "i-5", clientId: "c-wayne", channel: "email", occurredAt: `${addDays(today, -9)}T09:00:00.000Z`, summary: "Recordatorio de factura pendiente.", sentiment: "neutral", followUpDate: addDays(today, -2), followUpDone: false },
    { ...base, id: "i-6", clientId: "c-stark", channel: "note", occurredAt: `${addDays(today, -35)}T09:00:00.000Z`, summary: "Nota inicial de contacto para auditoría de marca.", sentiment: "neutral", followUpDone: true },
    { ...base, id: "i-7", clientId: "c-pixel", channel: "email", occurredAt: `${addDays(today, -12)}T09:00:00.000Z`, summary: "Cliente rechazó la propuesta de identidad.", sentiment: "negative", followUpDone: true },
    { ...base, id: "i-8", clientId: "c-nova", channel: "whatsapp", occurredAt: `${addDays(today, -3)}T14:00:00.000Z`, summary: "Compartió referencias para el manual de marca.", sentiment: "positive", followUpDone: true },
    { ...base, id: "i-9", clientId: "c-acme", channel: "call", occurredAt: `${addDays(today, -15)}T09:00:00.000Z`, summary: "Llamada de arranque del proyecto.", sentiment: "positive", followUpDone: true },
    { ...base, id: "i-10", clientId: "c-techcorp", channel: "email", occurredAt: `${addDays(today, -20)}T09:00:00.000Z`, summary: "Envío de cronograma del catálogo.", sentiment: "neutral", followUpDone: true },
    { ...base, id: "i-11", clientId: "c-startupx", channel: "note", occurredAt: `${addDays(today, -1)}T18:00:00.000Z`, summary: "Nota interna: priorizar pantalla de onboarding.", sentiment: "neutral", followUpDone: true },
    { ...base, id: "i-12", clientId: "c-globalretail", channel: "whatsapp", occurredAt: `${addDays(today, -2)}T12:00:00.000Z`, summary: "Cliente pidió adelantar la fecha de entrega.", sentiment: "neutral", followUpDate: addDays(today, 1), followUpDone: false },
  ];

  const aiConversations: AIConversation[] = [
    {
      ...base,
      id: "ai-1",
      title: "¿Qué facturas están vencidas?",
      pinned: false,
      messages: [
        { id: "msg-1", role: "user", content: "¿Qué facturas están vencidas?", createdAt: addDays(today, -1) + "T09:00:00.000Z" },
        {
          id: "msg-2",
          role: "assistant",
          content: "Tienes 1 factura vencida: FAC-1042 de Wayne Enterprises, vencida hace 23 días.",
          kind: "answer",
          createdAt: addDays(today, -1) + "T09:00:05.000Z",
        },
      ],
    },
  ];

  const settings = {
    userName: "Alex Rivera",
    businessName: "Freelancer OS",
    plan: "Plan Pro",
    currency: "USD" as const,
    defaultHourlyRateCents: 8500,
    defaultTaxRate: 0,
    defaultPaymentTermsDays: 15,
  };

  return {
    clients,
    interactions,
    opportunities,
    projects,
    deliverables,
    timeEntries,
    runningTimer: null,
    quotes,
    invoices,
    payments,
    meetings,
    documents,
    aiConversations,
    settings,
  };
}
