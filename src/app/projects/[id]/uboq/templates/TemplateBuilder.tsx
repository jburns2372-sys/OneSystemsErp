'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  buildInitialTemplate,
  listInitialTemplateSources,
} from '@/lib/uboq/templates/t0-t1';
import type {
  listSavedLayouts,
  loadSavedLayout,
  previewSavedLayout,
  SerializedSavedLayoutRevision,
} from '@/lib/uboq/templates/saved-layouts';
import type {
  buildFormalExportJsonPayload,
  listFormalContractCatalog,
} from '@/lib/uboq/templates/formal-t0-t1';
import type {
  listRoundTripWorkspaceState,
  VerifiedRoundTripImportResult,
} from '@/lib/uboq/templates/round-trip-import';

type Catalog = Awaited<ReturnType<typeof listInitialTemplateSources>>;
type WorkingPreview = Awaited<ReturnType<typeof buildInitialTemplate>>;
type SavedPreview = Awaited<ReturnType<typeof previewSavedLayout>>;
type FormalPreview = ReturnType<typeof buildFormalExportJsonPayload> & {
  outputSha256?: string;
};
type SavedLayoutList = Awaited<ReturnType<typeof listSavedLayouts>>;
type LoadedSavedLayout = Awaited<ReturnType<typeof loadSavedLayout>>;
type FormalCatalog = Awaited<ReturnType<typeof listFormalContractCatalog>>;
type RoundTripWorkspace = Awaited<ReturnType<typeof listRoundTripWorkspaceState>>;
type Template = Catalog['templates'][number];

const EXTRA_FIELD_HEADINGS: Record<string, string> = {
  vo_reference: 'Approved Variation Reference',
  pricing_type: 'Unit / Lump Sum / Milestone',
};

function requestMessage(status: number, code?: string) {
  if (status === 401) return 'Your session has expired. Sign in again.';
  if (status === 403) {
    if (code === 'ROUNDTRIP_SIGNATURE_INVALID') {
      return 'Cryptographic manifest signature verification failed. Upload an untampered signed round-trip package issued for this project.';
    }
    if (code === 'ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN') {
      return 'Your role is not authorized to modify commercial or financial contract/BOQ fields on round-trip import.';
    }
    return 'Your access does not permit this operation, sharing scope, source, or column set.';
  }
  if (status === 404) return 'The requested approved source or saved layout revision is not available.';
  if (status === 409) {
    if (code === 'FORMAL_OPEN_BLOCKING_EXCEPTIONS') {
      return 'Formal export is blocked while open BLOCKING validation exceptions exist on this project.';
    }
    if (code === 'FORMAL_MANDATORY_FIELD_MISSING') {
      return 'Formal export requires all mandatory contractual columns for this template. Use the canonical formal preset or include all mandatory fields in your saved layout.';
    }
    if (code === 'FORMAL_SPECIFICATION_NOT_DEFINED') {
      return 'Requested external agency specification is not defined; use the validated generic ERP formal contract.';
    }
    if (
      code === 'FORMAL_CONTRACT_ASSOCIATION_UNVERIFIED' ||
      code === 'FORMAL_CONTRACT_ASSOCIATION_MISMATCH' ||
      code === 'FORMAL_LINKED_CONTRACT_NOT_APPROVED' ||
      code === 'FORMAL_CONTRACT_RATE_ASSOCIATION_UNVERIFIED' ||
      code === 'TEMPLATE_CONTRACT_RATE_ASSOCIATION_UNVERIFIED' ||
      code === 'FORMAL_HISTORICAL_SNAPSHOT_NOT_FOUND' ||
      code === 'TEMPLATE_HISTORICAL_SNAPSHOT_NOT_FOUND' ||
      code === 'FORMAL_HISTORICAL_SNAPSHOT_AMBIGUOUS' ||
      code === 'TEMPLATE_HISTORICAL_SNAPSHOT_AMBIGUOUS'
    ) {
      return 'Historical BOQ snapshot or contract-rate authority association could not be verified as of the certificate cutoff date.';
    }
    if (
      code === 'FORMAL_PRIOR_CERTIFICATE_UNRESOLVED' ||
      code === 'TEMPLATE_PRIOR_CERTIFICATE_UNRESOLVED'
    ) {
      return 'An earlier approved SWA or Progress Billing certificate on this project has unresolved inspection, history continuity, or ceiling defects and cannot be skipped.';
    }
    if (
      code === 'FORMAL_PREVIOUS_BILLING_RECONCILIATION_MISMATCH' ||
      code === 'TEMPLATE_PREVIOUS_BILLING_RECONCILIATION_MISMATCH'
    ) {
      return 'Carried-forward previous certified/billed quantity does not reconcile against prior approved certificates on this project.';
    }
    if (
      code === 'FORMAL_MISSING_INSPECTION_EVIDENCE' ||
      code === 'TEMPLATE_MISSING_INSPECTION_EVIDENCE' ||
      code === 'FORMAL_INSPECTION_QUANTITY_INSUFFICIENT' ||
      code === 'TEMPLATE_INSPECTION_QUANTITY_INSUFFICIENT' ||
      code === 'FORMAL_DUPLICATE_INSPECTION_LINKAGE' ||
      code === 'TEMPLATE_DUPLICATE_INSPECTION_LINKAGE' ||
      code === 'FORMAL_INSPECTION_QUANTITY_INVALID' ||
      code === 'TEMPLATE_INSPECTION_QUANTITY_INVALID'
    ) {
      return 'SWA certification requires verified, non-duplicate QA/QC approved inspection quantities supporting every positive certified claim.';
    }
    if (
      code === 'FORMAL_OVERBILLING_CEILING_EXCEEDED' ||
      code === 'TEMPLATE_OVERBILLING_CEILING_EXCEEDED'
    ) {
      return 'Cumulative certified or billed quantity exceeds the approved BOQ plus approved Client Variation Order ceiling.';
    }
    if (code === 'TEMPLATE_CPM_CIRCULAR_DEPENDENCY') {
      return 'Schedule projection blocked due to a circular CPM network dependency.';
    }
    if (
      code === 'TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING' ||
      code === 'LAYOUT_OVERLAPPING_EVM_BOQ_MAPPING' ||
      code === 'TEMPLATE_AMBIGUOUS_EVM_BOQ_MAPPING' ||
      code === 'LAYOUT_AMBIGUOUS_EVM_BOQ_MAPPING' ||
      code === 'TEMPLATE_UNAPPROVED_EVM_SNAPSHOT_SOURCE' ||
      code === 'LAYOUT_UNAPPROVED_EVM_SNAPSHOT_SOURCE' ||
      code === 'TEMPLATE_EVM_CERTIFIED_BUDGET_EXCEEDED' ||
      code === 'LAYOUT_EVM_CERTIFIED_BUDGET_EXCEEDED'
    ) {
      return 'Schedule EVM projection blocked due to overlapping, ambiguous, or unapproved BOQ-to-activity scope mappings.';
    }
    if (
      code === 'TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID' ||
      code === 'LAYOUT_CASHFLOW_PERIOD_CONTINUITY_INVALID' ||
      code === 'TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH' ||
      code === 'LAYOUT_CASHFLOW_CUTOFF_PERIOD_MISMATCH' ||
      code === 'TEMPLATE_CASHFLOW_SOURCE_INCOMPLETE' ||
      code === 'LAYOUT_CASHFLOW_SOURCE_INCOMPLETE' ||
      code === 'TEMPLATE_DUPLICATE_COLLECTION_REFERENCE' ||
      code === 'LAYOUT_DUPLICATE_COLLECTION_REFERENCE' ||
      code === 'TEMPLATE_TREASURY_OPENING_BALANCE_UNVERIFIED' ||
      code === 'LAYOUT_TREASURY_OPENING_BALANCE_UNVERIFIED' ||
      code === 'TEMPLATE_TREASURY_OPENING_BOUNDARY_MISMATCH' ||
      code === 'LAYOUT_TREASURY_OPENING_BOUNDARY_MISMATCH' ||
      code === 'TEMPLATE_TREASURY_LIQUIDITY_MISREPRESENTATION_BLOCKED' ||
      code === 'LAYOUT_TREASURY_LIQUIDITY_MISREPRESENTATION_BLOCKED'
    ) {
      return 'Cash-flow or treasury reconciliation blocked due to unverified/misaligned treasury opening balances, actual-liquidity heading misrepresentation without verified opening cash, period continuity/cutoff mismatches, or duplicate collection references.';
    }
    if (
      code === 'TEMPLATE_DUPLICATE_VO_RECOGNITION' ||
      code === 'LAYOUT_DUPLICATE_VO_RECOGNITION' ||
      code === 'FORMAL_DUPLICATE_VO_RECOGNITION' ||
      code === 'TEMPLATE_VO_SOURCE_DOCUMENT_MISSING' ||
      code === 'LAYOUT_VO_SOURCE_DOCUMENT_MISSING' ||
      code === 'FORMAL_VO_SOURCE_DOCUMENT_MISSING' ||
      code === 'TEMPLATE_VO_ITEM_APPROVAL_INCOMPLETE' ||
      code === 'LAYOUT_VO_ITEM_APPROVAL_INCOMPLETE' ||
      code === 'FORMAL_VO_ITEM_APPROVAL_INCOMPLETE' ||
      code === 'TEMPLATE_VO_LINEAGE_UNVERIFIED' ||
      code === 'LAYOUT_VO_LINEAGE_UNVERIFIED' ||
      code === 'FORMAL_VO_LINEAGE_UNVERIFIED' ||
      code === 'TEMPLATE_VO_ARITHMETIC_MISMATCH' ||
      code === 'LAYOUT_VO_ARITHMETIC_MISMATCH' ||
      code === 'FORMAL_VO_ARITHMETIC_MISMATCH' ||
      code === 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS' ||
      code === 'LAYOUT_VO_REVISED_QUANTITY_AMBIGUOUS' ||
      code === 'FORMAL_VO_REVISED_QUANTITY_AMBIGUOUS' ||
      code === 'TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION' ||
      code === 'LAYOUT_UNAUTHORIZED_BOQ_VO_MUTATION' ||
      code === 'FORMAL_UNAUTHORIZED_BOQ_VO_MUTATION'
    ) {
      return 'Variation Order Register blocked due to unapproved VO source documents, unverified BOQ/snapshot lineage, zero/non-zero VO arithmetic mismatches, ambiguous revised quantities, duplicate VO recognition, or unauthorized BOQ mutation.';
    }
    if (
      code === 'TEMPLATE_SUBCONTRACT_COMMITMENT_EXCEEDED' ||
      code === 'LAYOUT_SUBCONTRACT_COMMITMENT_EXCEEDED' ||
      code === 'TEMPLATE_DUPLICATE_COMMITMENT_CONFLICT' ||
      code === 'LAYOUT_DUPLICATE_COMMITMENT_CONFLICT'
    ) {
      return 'Executive commitment reconciliation blocked due to child job orders exceeding subcontract ceilings or conflicting duplicate commitment references.';
    }
    if (code === 'ROUNDTRIP_LAYOUT_VERSION_SUPERSEDED') {
      return 'This signed round-trip package was issued from a superseded saved layout revision. Issue a fresh package from the latest layout revision.';
    }
    if (code === 'ROUNDTRIP_SOURCE_STALE_OR_MODIFIED') {
      return 'The underlying approved contract or BOQ snapshot changed after this package was issued. Silent overwrites are blocked.';
    }
    if (code === 'ROUNDTRIP_SILENT_OVERWRITE_BLOCKED') {
      return 'Direct in-place overwrites of approved contract authorities or AwardedBOQItem baselines are prohibited; stage a governed change proposal instead.';
    }
    if (
      code === 'ROUNDTRIP_PACKAGE_REPLAY_BLOCKED' ||
      code === 'ROUNDTRIP_IDEMPOTENCY_KEY_CONFLICT'
    ) {
      return 'Round-trip replay or idempotency key conflict detected. Each signed package is single-consumption.';
    }
    if (
      code === 'ROUNDTRIP_ROW_LINEAGE_TAMPERED' ||
      code === 'ROUNDTRIP_IMMUTABLE_IDENTITY_MODIFIED' ||
      code === 'ROUNDTRIP_LAYOUT_HEADER_MISMATCH' ||
      code === 'ROUNDTRIP_FINANCIAL_LINE_AMOUNT_MISMATCH'
    ) {
      return 'Round-trip lineage, column headers, immutable row anchors, or unit-price line amount reconciliation failed verification.';
    }
    return 'Revision conflict or compliance rule blocked the request. Reload the latest saved layout revision.';
  }
  if (status === 400 && code === 'ROUNDTRIP_FORMULA_CELL_PROHIBITED') {
    return 'Executable spreadsheet formulas (<f> tags) are prohibited in round-trip imports; submit static verified values only.';
  }
  if (status === 400 && code === 'ROUNDTRIP_TEMPLATE_UNRATIFIED_PENDING_OWNER_APPROVAL') {
    return 'Requested T11/T12 template slot is pending Project Owner contract ratification and is not active.';
  }
  if (status === 413) return 'This request exceeds the current template size limit.';
  return 'The template request could not be completed. Check column selection, unique plain-text headings, and layout name.';
}

async function readErrorMessage(response: Response): Promise<string> {
  let code: string | undefined;
  try {
    const parsed = (await response.clone().json()) as { error?: string };
    code = parsed.error;
  } catch {
    // non-json error fallback
  }
  return requestMessage(response.status, code);
}

export default function TemplateBuilder({ projectId }: { projectId: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayoutList | null>(null);
  const [formalCatalog, setFormalCatalog] = useState<FormalCatalog | null>(null);
  const [roundTripState, setRoundTripState] = useState<RoundTripWorkspace | null>(null);
  const [selected, setSelected] = useState('T1_PHASE_BOQ');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refreshSavedLayouts = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(
        `/api/uboq/templates/layouts?projectId=${encodeURIComponent(projectId)}`,
        { signal, cache: 'no-store' }
      );
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const data = (await response.json()) as SavedLayoutList;
      if (!signal?.aborted) setSavedLayouts(data);
    },
    [projectId]
  );

  const refreshRoundTripState = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(
        `/api/uboq/templates/round-trip?projectId=${encodeURIComponent(projectId)}`,
        { signal, cache: 'no-store' }
      );
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const data = (await response.json()) as RoundTripWorkspace;
      if (!signal?.aborted) setRoundTripState(data);
    },
    [projectId]
  );

  useEffect(() => {
    const abort = new AbortController();
    async function loadAll() {
      try {
        const [srcRes, layoutsRes, formalRes, rtRes] = await Promise.all([
          fetch(`/api/uboq/templates?projectId=${encodeURIComponent(projectId)}`, {
            signal: abort.signal,
            cache: 'no-store',
          }),
          fetch(`/api/uboq/templates/layouts?projectId=${encodeURIComponent(projectId)}`, {
            signal: abort.signal,
            cache: 'no-store',
          }),
          fetch(`/api/uboq/templates/formal-export?projectId=${encodeURIComponent(projectId)}`, {
            signal: abort.signal,
            cache: 'no-store',
          }),
          fetch(`/api/uboq/templates/round-trip?projectId=${encodeURIComponent(projectId)}`, {
            signal: abort.signal,
            cache: 'no-store',
          }),
        ]);
        if (!srcRes.ok) throw new Error(await readErrorMessage(srcRes));
        if (!layoutsRes.ok) throw new Error(await readErrorMessage(layoutsRes));
        if (!formalRes.ok) throw new Error(await readErrorMessage(formalRes));
        if (!rtRes.ok) throw new Error(await readErrorMessage(rtRes));
        const [srcJson, layoutsJson, formalJson, rtJson] = await Promise.all([
          srcRes.json() as Promise<Catalog>,
          layoutsRes.json() as Promise<SavedLayoutList>,
          formalRes.json() as Promise<FormalCatalog>,
          rtRes.json() as Promise<RoundTripWorkspace>,
        ]);
        if (!abort.signal.aborted) {
          setCatalog(srcJson);
          setSavedLayouts(layoutsJson);
          setFormalCatalog(formalJson);
          setRoundTripState(rtJson);
        }
      } catch (e) {
        if (!abort.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Template workspace unavailable.');
        }
      }
    }
    void loadAll();
    return () => abort.abort();
  }, [projectId]);

  if (error) return <p role="alert">{error}</p>;
  if (!catalog || !savedLayouts || !formalCatalog || !roundTripState) {
    return <p role="status">Loading approved sources, saved layouts, and formal contracts…</p>;
  }
  const template = catalog.templates.find((t) => t.code === selected) ?? catalog.templates[0]!;
  const formalSpec =
    formalCatalog.contracts.find((c) => c.templateCode === template.code) ?? null;

  return (
    <section
      aria-label="Template builder"
      style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <label htmlFor="template-code">Template </label>
      <select
        id="template-code"
        value={selected}
        disabled={busy}
        style={{ maxWidth: '100%', boxSizing: 'border-box' }}
        onChange={(e) => setSelected(e.target.value)}
      >
        {catalog.templates.map((t) => (
          <option key={t.code} value={t.code}>
            {t.name}
          </option>
        ))}
      </select>
      <TemplateEditor
        key={template.code}
        projectId={projectId}
        template={template}
        savedLayouts={savedLayouts}
        formalCatalog={formalCatalog}
        formalSpec={formalSpec}
        roundTripState={roundTripState}
        onRefreshLayouts={() => refreshSavedLayouts()}
        onRefreshRoundTrip={() => refreshRoundTripState()}
        onBusyChange={setBusy}
      />
    </section>
  );
}

function TemplateEditor({
  projectId,
  template,
  savedLayouts,
  formalCatalog,
  formalSpec,
  roundTripState,
  onRefreshLayouts,
  onRefreshRoundTrip,
  onBusyChange,
}: {
  projectId: string;
  template: Template;
  savedLayouts: SavedLayoutList;
  formalCatalog: FormalCatalog;
  formalSpec: FormalCatalog['contracts'][number] | null;
  roundTripState: RoundTripWorkspace;
  onRefreshLayouts: () => Promise<void>;
  onRefreshRoundTrip: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}) {
  // Merge base Increment 01 catalog fields with any additional authorized formal fields
  const availableFields: Array<{ id: string; heading: string; selectedByDefault: boolean }> = [
    ...template.fields,
    ...Object.entries(EXTRA_FIELD_HEADINGS)
      .filter(([id]) => {
        const isT0Field = id === 'vo_reference' && template.code === 'T0_MASTER_CONTRACT';
        const isT1Field = id === 'pricing_type' && template.code === 'T1_PHASE_BOQ';
        return (isT0Field || isT1Field) && !template.fields.some((f) => f.id === id);
      })
      .map(([id, heading]) => ({ id, heading, selectedByDefault: false })),
  ];

  const [sourceId, setSourceId] = useState(template.sources[0]?.id || '');
  const [fields, setFields] = useState(
    availableFields.filter((f) => f.selectedByDefault).map((f) => f.id)
  );
  const [aliases, setAliases] = useState<Record<string, string>>({});

  // Saved layout state
  const templateGroups = savedLayouts.groups.filter(
    (g) => g.latest.templateCode === template.code
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    templateGroups[0]?.layoutGroupId || ''
  );
  const activeGroupId =
    selectedGroupId && templateGroups.some((g) => g.layoutGroupId === selectedGroupId)
      ? selectedGroupId
      : templateGroups[0]?.layoutGroupId || '';
  const selectedGroup = templateGroups.find((g) => g.layoutGroupId === activeGroupId) || null;
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>(
    selectedGroup?.latest.id || ''
  );
  const activeRevisionId =
    selectedRevisionId && selectedGroup?.revisions.some((r) => r.id === selectedRevisionId)
      ? selectedRevisionId
      : selectedGroup?.latest.id || '';
  const [loadedLayout, setLoadedLayout] = useState<LoadedSavedLayout | null>(null);

  const [layoutName, setLayoutName] = useState('');
  const [sharingScope, setSharingScope] = useState<'PRIVATE' | 'PROJECT_SHARED'>('PRIVATE');
  const [changeSummary, setChangeSummary] = useState('');
  const [formalLayoutTarget, setFormalLayoutTarget] = useState<'SYSTEM_PRESET' | 'LOADED_LAYOUT'>(
    'SYSTEM_PRESET'
  );

  const [workingPreview, setWorkingPreview] = useState<WorkingPreview | SavedPreview | null>(null);
  const [formalPreview, setFormalPreview] = useState<FormalPreview | null>(null);
  const [roundTripLayoutMode, setRoundTripLayoutMode] = useState<
    'WORKING_PRESET' | 'SAVED_LAYOUT' | 'FORMAL_CONTRACT'
  >('WORKING_PRESET');
  const [roundTripFile, setRoundTripFile] = useState<File | null>(null);
  const [roundTripIdemKey, setRoundTripIdemKey] = useState(
    () => `rt-idem-${Date.now().toString(36)}`
  );
  const [roundTripMode, setRoundTripMode] = useState<
    'STAGE_GOVERNED_CHANGE_PROPOSAL' | 'VERIFY_ONLY'
  >('STAGE_GOVERNED_CHANGE_PROPOSAL');
  const [roundTripNote, setRoundTripNote] = useState('');
  const [roundTripResult, setRoundTripResult] = useState<VerifiedRoundTripImportResult | null>(
    null
  );
  const [statusNotice, setStatusNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function resetOutputs() {
    setWorkingPreview(null);
    setFormalPreview(null);
    setRoundTripResult(null);
    setError('');
  }

  function applyLoadedRevisionToControls(rev: SerializedSavedLayoutRevision) {
    const validIds = rev.selectedFields.filter((id) =>
      availableFields.some((f) => f.id === id)
    );
    setFields(validIds);
    setAliases(rev.headingAliases);
    setLayoutName(rev.templateName);
    setSharingScope(rev.sharingScope);
    setChangeSummary('');
  }

  function move(index: number, offset: number) {
    const next = [...fields];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setFields(next);
    resetOutputs();
  }

  function currentHeadingAliases(): Record<string, string> {
    return Object.fromEntries(
      fields.filter((f) => aliases[f] !== undefined).map((f) => [f, aliases[f]])
    );
  }

  async function runBusy(task: () => Promise<void>) {
    setBusy(true);
    onBusyChange(true);
    setError('');
    setStatusNotice('');
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Template operation failed.');
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  async function prepareWorkingCopy(format: 'json' | 'xlsx' | 'csv') {
    await runBusy(async () => {
      setWorkingPreview(null);
      setFormalPreview(null);
      const response = await fetch('/api/uboq/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          templateCode: template.code,
          sourceId,
          selectedFields: fields,
          headingAliases: currentHeadingAliases(),
          format,
        }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      if (format === 'json') {
        setWorkingPreview((await response.json()) as WorkingPreview);
      } else {
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.code}_${sourceId}.${format}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
  }

  async function handleLoadRevision() {
    if (!activeRevisionId) return;
    await runBusy(async () => {
      resetOutputs();
      const response = await fetch(
        `/api/uboq/templates/layouts?projectId=${encodeURIComponent(projectId)}&layoutRevisionId=${encodeURIComponent(activeRevisionId)}`,
        { cache: 'no-store' }
      );
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const loaded = (await response.json()) as LoadedSavedLayout;
      setLoadedLayout(loaded);
      applyLoadedRevisionToControls(loaded.revision);
      setStatusNotice(
        `Loaded "${loaded.revision.templateName}" v${loaded.revision.versionNumber} (${loaded.revision.sharingScope}).`
      );
    });
  }

  async function handlePreviewSavedRevision() {
    const revId = loadedLayout?.revision.id || activeRevisionId;
    if (!revId || !sourceId) return;
    await runBusy(async () => {
      setWorkingPreview(null);
      setFormalPreview(null);
      const response = await fetch('/api/uboq/templates/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          projectId,
          sourceId,
          layoutRevisionId: revId,
        }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      setWorkingPreview((await response.json()) as SavedPreview);
    });
  }

  async function handleCreateSavedLayout() {
    await runBusy(async () => {
      const response = await fetch('/api/uboq/templates/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          projectId,
          templateCode: template.code,
          templateName: layoutName,
          selectedFields: fields,
          headingAliases: currentHeadingAliases(),
          sharingScope,
          changeSummary: changeSummary || undefined,
        }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const { revision } = (await response.json()) as {
        revision: SerializedSavedLayoutRevision;
      };
      await onRefreshLayouts();
      setSelectedGroupId(revision.layoutGroupId);
      setSelectedRevisionId(revision.id);
      const loadedRes = await fetch(
        `/api/uboq/templates/layouts?projectId=${encodeURIComponent(projectId)}&layoutRevisionId=${encodeURIComponent(revision.id)}`,
        { cache: 'no-store' }
      );
      if (loadedRes.ok) {
        setLoadedLayout((await loadedRes.json()) as LoadedSavedLayout);
      }
      setChangeSummary('');
      setStatusNotice(
        `Saved layout "${revision.templateName}" v${revision.versionNumber} (${revision.sharingScope}).`
      );
    });
  }

  async function handleVersionSavedLayout() {
    if (!loadedLayout) return;
    const headVersion = loadedLayout.revisions[0]?.versionNumber ?? loadedLayout.revision.versionNumber;
    await runBusy(async () => {
      const response = await fetch('/api/uboq/templates/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'version',
          projectId,
          layoutGroupId: loadedLayout.revision.layoutGroupId,
          expectedVersionNumber: headVersion,
          templateName: layoutName,
          selectedFields: fields,
          headingAliases: currentHeadingAliases(),
          sharingScope,
          changeSummary: changeSummary || undefined,
        }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const { revision } = (await response.json()) as {
        revision: SerializedSavedLayoutRevision;
      };
      await onRefreshLayouts();
      setSelectedGroupId(revision.layoutGroupId);
      setSelectedRevisionId(revision.id);
      const loadedRes = await fetch(
        `/api/uboq/templates/layouts?projectId=${encodeURIComponent(projectId)}&layoutRevisionId=${encodeURIComponent(revision.id)}`,
        { cache: 'no-store' }
      );
      if (loadedRes.ok) {
        setLoadedLayout((await loadedRes.json()) as LoadedSavedLayout);
      }
      setChangeSummary('');
      setStatusNotice(
        `Saved revision v${revision.versionNumber} of "${revision.templateName}" (prior revisions preserved).`
      );
    });
  }

  async function handleDuplicateLayout() {
    const sourceRevId = loadedLayout?.revision.id || activeRevisionId;
    if (!sourceRevId) return;
    await runBusy(async () => {
      const response = await fetch('/api/uboq/templates/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate',
          projectId,
          sourceRevisionId: sourceRevId,
          templateName: layoutName ? `${layoutName} (Copy)`.slice(0, 120) : undefined,
          sharingScope: 'PRIVATE',
          changeSummary: changeSummary || undefined,
        }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const { revision } = (await response.json()) as {
        revision: SerializedSavedLayoutRevision;
      };
      await onRefreshLayouts();
      setSelectedGroupId(revision.layoutGroupId);
      setSelectedRevisionId(revision.id);
      const loadedRes = await fetch(
        `/api/uboq/templates/layouts?projectId=${encodeURIComponent(projectId)}&layoutRevisionId=${encodeURIComponent(revision.id)}`,
        { cache: 'no-store' }
      );
      if (loadedRes.ok) {
        const nextLoaded = (await loadedRes.json()) as LoadedSavedLayout;
        setLoadedLayout(nextLoaded);
        applyLoadedRevisionToControls(nextLoaded.revision);
      }
      setStatusNotice(
        `Duplicated into new layout "${revision.templateName}" v1.`
      );
    });
  }

  async function handleFormalExport(format: 'json' | 'xlsx' | 'csv') {
    if (!sourceId || !formalSpec) return;
    await runBusy(async () => {
      setWorkingPreview(null);
      setFormalPreview(null);
      const useSaved =
        formalLayoutTarget === 'LOADED_LAYOUT' && loadedLayout?.revision.id;
      const response = await fetch('/api/uboq/templates/formal-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          templateCode: template.code,
          sourceId,
          format,
          contractCode: formalSpec.contractCode,
          ...(useSaved ? { layoutRevisionId: loadedLayout!.revision.id } : {}),
        }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      if (format === 'json') {
        const body = (await response.json()) as FormalPreview;
        setFormalPreview({
          ...body,
          outputSha256: response.headers.get('X-OSERP-Output-Sha256') || undefined,
        });
      } else {
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = url;
        const vTag = useSaved ? `v${loadedLayout!.revision.versionNumber}` : 'preset_v1';
        link.download = `${formalSpec.contractCode}_${sourceId}_${vTag}.${format}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatusNotice(`Downloaded formal ${format.toUpperCase()} (${formalSpec.contractCode}).`);
      }
    });
  }

  if (!template.sources.length) {
    return (
      <p role="status">
        No approved source is available for this template. Complete the existing review and approval workflow first.
      </p>
    );
  }

  const headVersion =
    loadedLayout?.revisions[0]?.versionNumber ?? loadedLayout?.revision.versionNumber ?? 1;

  const fieldsetStyle = {
    marginTop: 20,
    padding: 16,
    minWidth: 0,
    minInlineSize: 0,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  };
  const controlGroupStyle = {
    minWidth: 0,
    maxWidth: '100%',
  };
  const controlInputStyle = {
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <fieldset disabled={busy} style={fieldsetStyle}>
        <legend>Source and columns</legend>
        <div style={controlGroupStyle}>
          <label htmlFor="approved-source">Approved source </label>
          <select
            id="approved-source"
            value={sourceId}
            style={controlInputStyle}
            onChange={(e) => {
              setSourceId(e.target.value);
              resetOutputs();
            }}
          >
            {template.sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <p>Select columns, then rename or move them in the output order below.</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
          {availableFields.map((f) => (
            <label key={f.id} style={{ minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' }}>
              <input
                type="checkbox"
                checked={fields.includes(f.id)}
                onChange={(e) => {
                  setFields(
                    e.target.checked
                      ? [...fields, f.id]
                      : fields.filter((id) => id !== f.id)
                  );
                  resetOutputs();
                }}
              />
              {f.heading}
            </label>
          ))}
        </div>
        <ol style={{ paddingLeft: 20, maxWidth: '100%', boxSizing: 'border-box' }}>
          {fields.map((id, index) => {
            const field = availableFields.find((f) => f.id === id)!;
            const isWorkingSupported = template.fields.some((f) => f.id === id);
            return (
              <li key={id} style={{ marginTop: 8, overflowWrap: 'anywhere', maxWidth: '100%' }}>
                <label htmlFor={`heading-${id}`}>{field.heading} </label>
                <input
                  id={`heading-${id}`}
                  value={aliases[id] ?? field.heading}
                  maxLength={120}
                  style={controlInputStyle}
                  onChange={(e) => {
                    setAliases({ ...aliases, [id]: e.target.value });
                    resetOutputs();
                  }}
                />{' '}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${field.heading} up`}
                >
                  ↑
                </button>{' '}
                <button
                  type="button"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${field.heading} down`}
                >
                  ↓
                </button>
                {!isWorkingSupported && (
                  <span> (saved layout / formal export column)</span>
                )}
              </li>
            );
          })}
        </ol>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
          <button
            type="button"
            disabled={
              !fields.length ||
              fields.some((f) => !template.fields.some((tf) => tf.id === f))
            }
            onClick={() => void prepareWorkingCopy('json')}
          >
            Preview
          </button>
          <button
            type="button"
            disabled={
              !fields.length ||
              fields.some((f) => !template.fields.some((tf) => tf.id === f))
            }
            onClick={() => void prepareWorkingCopy('xlsx')}
          >
            Download working XLSX
          </button>
          <button
            type="button"
            disabled={
              !fields.length ||
              fields.some((f) => !template.fields.some((tf) => tf.id === f))
            }
            onClick={() => void prepareWorkingCopy('csv')}
          >
            Download working CSV
          </button>
          {formalSpec && formalCatalog.canFormalExport && (
            <button
              type="button"
              onClick={() => {
                const formalIds = formalSpec.presetFields.filter((fId) =>
                  availableFields.some((af) => af.id === fId)
                );
                setFields(formalIds);
                resetOutputs();
              }}
            >
              Select all formal contract columns
            </button>
          )}
        </div>
      </fieldset>

      <fieldset disabled={busy} style={fieldsetStyle}>
        <legend>Saved layouts (persistent &amp; versioned)</legend>
        {templateGroups.length > 0 ? (
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: 12,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <div style={controlGroupStyle}>
              <label htmlFor="saved-layout-group">Saved layout </label>
              <select
                id="saved-layout-group"
                value={activeGroupId}
                style={controlInputStyle}
                onChange={(e) => {
                  const nextGrpId = e.target.value;
                  setSelectedGroupId(nextGrpId);
                  const grp = templateGroups.find((g) => g.layoutGroupId === nextGrpId);
                  setSelectedRevisionId(grp?.latest.id || '');
                }}
              >
                {templateGroups.map((g) => (
                  <option key={g.layoutGroupId} value={g.layoutGroupId}>
                    {g.latest.templateName} (latest v{g.latest.versionNumber}, {g.latest.sharingScope})
                  </option>
                ))}
              </select>
            </div>
            {selectedGroup && (
              <div style={controlGroupStyle}>
                <label htmlFor="saved-layout-revision">Revision </label>
                <select
                  id="saved-layout-revision"
                  value={activeRevisionId}
                  style={controlInputStyle}
                  onChange={(e) => setSelectedRevisionId(e.target.value)}
                >
                  {selectedGroup.revisions.map((r) => (
                    <option key={r.id} value={r.id}>
                      v{r.versionNumber} — {r.sharingScope}
                      {r.changeSummary ? ` (${r.changeSummary})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              disabled={!activeRevisionId}
              onClick={() => void handleLoadRevision()}
            >
              Load revision
            </button>
            <button
              type="button"
              disabled={!activeRevisionId}
              onClick={() => void handlePreviewSavedRevision()}
            >
              Preview saved revision
            </button>
            {savedLayouts.capabilities.canWritePrivate && (
              <button
                type="button"
                disabled={!activeRevisionId}
                onClick={() => void handleDuplicateLayout()}
              >
                Duplicate layout
              </button>
            )}
          </div>
        ) : (
          <p>No saved layouts exist yet for {template.name} on this project.</p>
        )}

        {savedLayouts.capabilities.canWritePrivate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, maxWidth: '100%' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', minWidth: 0, maxWidth: '100%' }}>
              <div style={controlGroupStyle}>
                <label htmlFor="layout-name">Layout name </label>
                <input
                  id="layout-name"
                  value={layoutName}
                  maxLength={120}
                  placeholder="e.g. Monthly Commercial BOQ View"
                  style={controlInputStyle}
                  onChange={(e) => setLayoutName(e.target.value)}
                />
              </div>
              <div style={controlGroupStyle}>
                <label htmlFor="layout-sharing">Sharing scope </label>
                <select
                  id="layout-sharing"
                  value={sharingScope}
                  style={controlInputStyle}
                  onChange={(e) =>
                    setSharingScope(e.target.value as 'PRIVATE' | 'PROJECT_SHARED')
                  }
                >
                  <option value="PRIVATE">Private (creator only)</option>
                  {savedLayouts.capabilities.canShareProject && (
                    <option value="PROJECT_SHARED">Project shared (authorized project team)</option>
                  )}
                </select>
              </div>
              <div style={controlGroupStyle}>
                <label htmlFor="layout-change-summary">Revision note </label>
                <input
                  id="layout-change-summary"
                  value={changeSummary}
                  maxLength={240}
                  placeholder="Optional change note"
                  style={controlInputStyle}
                  onChange={(e) => setChangeSummary(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
              <button
                type="button"
                disabled={!fields.length || !layoutName.trim()}
                onClick={() => void handleCreateSavedLayout()}
              >
                Save new layout
              </button>
              {loadedLayout &&
                loadedLayout.revision.templateCode === template.code &&
                loadedLayout.revision.canEditVersion && (
                  <button
                    type="button"
                    disabled={!fields.length || !layoutName.trim()}
                    onClick={() => void handleVersionSavedLayout()}
                  >
                    Save new revision (v{headVersion + 1})
                  </button>
                )}
            </div>
          </div>
        ) : (
          <p>Read-only project assignment: you can load and preview shared layouts, but cannot save or version layouts.</p>
        )}

        {loadedLayout && loadedLayout.revision.templateCode === template.code && (
          <div style={{ marginTop: 12, overflowWrap: 'anywhere', minWidth: 0, maxWidth: '100%' }}>
            <p>
              Active loaded layout: <strong>{loadedLayout.revision.templateName}</strong> — revision{' '}
              <strong>v{loadedLayout.revision.versionNumber}</strong> ({loadedLayout.revision.sharingScope}),{' '}
              {loadedLayout.revisions.length} preserved revision(s),{' '}
              {loadedLayout.auditTrail.length} audit provenance record(s).
            </p>
          </div>
        )}
      </fieldset>

      <fieldset disabled={busy} style={fieldsetStyle}>
        <legend>Formal compliance export contract</legend>
        {formalSpec ? (
          <>
            <p style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              Contract: <strong>{formalSpec.contractCode}</strong> ({formalSpec.contractTitle}).{' '}
              External agency specification status:{' '}
              <code style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {formalSpec.externalAgencySpecStatus}
              </code>{' '}
              (missing external specs: {formalSpec.missingExternalContracts.join(', ')}; no agency headers or signatory fields invented).
            </p>
            {formalCatalog.openBlockingExceptions > 0 && (
              <p role="alert">
                {formalCatalog.openBlockingExceptions} open BLOCKING validation exception(s) exist on this project; formal export is blocked until resolved.
              </p>
            )}
            {formalCatalog.canFormalExport ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, maxWidth: '100%' }}>
                <div style={controlGroupStyle}>
                  <label htmlFor="formal-layout-target">Formal layout identity </label>
                  <select
                    id="formal-layout-target"
                    value={formalLayoutTarget}
                    style={controlInputStyle}
                    onChange={(e) => {
                      setFormalLayoutTarget(
                        e.target.value as 'SYSTEM_PRESET' | 'LOADED_LAYOUT'
                      );
                      resetOutputs();
                    }}
                  >
                    <option value="SYSTEM_PRESET">
                      Canonical ERP formal preset (v1)
                    </option>
                    {loadedLayout && loadedLayout.revision.templateCode === template.code && (
                      <option value="LOADED_LAYOUT">
                        Loaded saved layout: {loadedLayout.revision.templateName} (v
                        {loadedLayout.revision.versionNumber})
                      </option>
                    )}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                  <button
                    type="button"
                    disabled={formalCatalog.openBlockingExceptions > 0}
                    onClick={() => void handleFormalExport('json')}
                  >
                    Preview formal output
                  </button>
                  <button
                    type="button"
                    disabled={formalCatalog.openBlockingExceptions > 0}
                    onClick={() => void handleFormalExport('xlsx')}
                  >
                    Download formal XLSX
                  </button>
                  <button
                    type="button"
                    disabled={formalCatalog.openBlockingExceptions > 0}
                    onClick={() => void handleFormalExport('csv')}
                  >
                    Download formal CSV
                  </button>
                </div>
              </div>
            ) : (
              <p>Formal contract export requires authorized commercial, procurement, or executive access to restricted financial columns.</p>
            )}
          </>
        ) : (
          <p>
            <strong>{template.name}</strong> is a governed analytical working-copy and saved-layout projection (<code>isFormalComplianceOutput: false</code>). Internal ERP formal compliance export contracts apply to T0, T1, T4, T5, T6, and T11.
          </p>
        )}
      </fieldset>

      <fieldset disabled={busy} style={fieldsetStyle}>
        <legend>Signed T0/T1 round-trip package &amp; controlled re-import</legend>
        {template.code === 'T0_MASTER_CONTRACT' || template.code === 'T1_PHASE_BOQ' ? (
          roundTripState.capabilities.canStageRoundTrip ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              <p style={{ margin: 0, overflowWrap: 'anywhere' }}>
                Issues a trust-anchor signed <code>{template.code}</code> package bound to this
                project, source hash, row lineage, and layout definition. Re-imports never overwrite{' '}
                <code>AwardedBOQItem</code> or approved snapshots in place; verified deltas stage a
                governed proposal (
                {roundTripState.capabilities.canModifyFinancialFields
                  ? 'commercial + scope fields authorized'
                  : 'non-financial scope fields only; commercial fields locked'}
                ).
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  minWidth: 0,
                  maxWidth: '100%',
                }}
              >
                <div style={controlGroupStyle}>
                  <label htmlFor="roundtrip-layout-mode">Signed package layout </label>
                  <select
                    id="roundtrip-layout-mode"
                    value={roundTripLayoutMode}
                    style={controlInputStyle}
                    onChange={(e) =>
                      setRoundTripLayoutMode(
                        e.target.value as 'WORKING_PRESET' | 'SAVED_LAYOUT' | 'FORMAL_CONTRACT'
                      )
                    }
                  >
                    <option value="WORKING_PRESET">Selected columns / preset</option>
                    {loadedLayout && loadedLayout.revision.templateCode === template.code && (
                      <option value="SAVED_LAYOUT">
                        Loaded saved layout (v{loadedLayout.revision.versionNumber})
                      </option>
                    )}
                    {formalSpec && formalCatalog.canFormalExport && (
                      <option value="FORMAL_CONTRACT">
                        Formal contract ({formalSpec.contractCode})
                      </option>
                    )}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={!fields.length}
                  onClick={() =>
                    void runBusy(async () => {
                      const useSaved =
                        roundTripLayoutMode === 'SAVED_LAYOUT' && loadedLayout?.revision.id;
                      const response = await fetch('/api/uboq/templates/round-trip', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'issue',
                          projectId,
                          templateCode: template.code,
                          sourceId,
                          format: 'xlsx',
                          layoutMode: roundTripLayoutMode,
                          ...(useSaved
                            ? { layoutRevisionId: loadedLayout!.revision.id }
                            : roundTripLayoutMode === 'WORKING_PRESET'
                              ? {
                                  selectedFields: fields,
                                  headingAliases: currentHeadingAliases(),
                                }
                              : {}),
                        }),
                      });
                      if (!response.ok) throw new Error(await readErrorMessage(response));
                      const pkgId =
                        response.headers.get('X-OSERP-RoundTrip-Package-Id') || 'signed-pkg';
                      const sha = response.headers.get('X-OSERP-Output-Sha256') || '';
                      const url = URL.createObjectURL(await response.blob());
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${template.code}_${sourceId}_${pkgId}.xlsx`;
                      link.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                      setStatusNotice(
                        `Issued signed XLSX package ${pkgId}${sha ? ` (SHA-256 ${sha.slice(0, 12)}…)` : ''}.`
                      );
                    })
                  }
                >
                  Download signed XLSX package
                </button>
                <button
                  type="button"
                  disabled={!fields.length}
                  onClick={() =>
                    void runBusy(async () => {
                      const useSaved =
                        roundTripLayoutMode === 'SAVED_LAYOUT' && loadedLayout?.revision.id;
                      const response = await fetch('/api/uboq/templates/round-trip', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'issue',
                          projectId,
                          templateCode: template.code,
                          sourceId,
                          format: 'json',
                          layoutMode: roundTripLayoutMode,
                          ...(useSaved
                            ? { layoutRevisionId: loadedLayout!.revision.id }
                            : roundTripLayoutMode === 'WORKING_PRESET'
                              ? {
                                  selectedFields: fields,
                                  headingAliases: currentHeadingAliases(),
                                }
                              : {}),
                        }),
                      });
                      if (!response.ok) throw new Error(await readErrorMessage(response));
                      const pkgId =
                        response.headers.get('X-OSERP-RoundTrip-Package-Id') || 'signed-pkg';
                      const url = URL.createObjectURL(await response.blob());
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${template.code}_${sourceId}_${pkgId}.json`;
                      link.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                      setStatusNotice(`Issued signed JSON package ${pkgId}.`);
                    })
                  }
                >
                  Download signed JSON package
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  minWidth: 0,
                  maxWidth: '100%',
                }}
              >
                <div style={controlGroupStyle}>
                  <label htmlFor="roundtrip-file">Signed file (.xlsx / .json) </label>
                  <input
                    id="roundtrip-file"
                    type="file"
                    accept=".xlsx,.json"
                    style={controlInputStyle}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setRoundTripFile(f);
                      setRoundTripIdemKey(`rt-idem-${Date.now().toString(36)}`);
                    }}
                  />
                </div>
                <div style={controlGroupStyle}>
                  <label htmlFor="roundtrip-mode">Re-import mode </label>
                  <select
                    id="roundtrip-mode"
                    value={roundTripMode}
                    style={controlInputStyle}
                    onChange={(e) =>
                      setRoundTripMode(
                        e.target.value as 'STAGE_GOVERNED_CHANGE_PROPOSAL' | 'VERIFY_ONLY'
                      )
                    }
                  >
                    <option value="STAGE_GOVERNED_CHANGE_PROPOSAL">
                      Stage governed change proposal (zero overwrite)
                    </option>
                    <option value="VERIFY_ONLY">Verify baseline integrity only (no changes)</option>
                  </select>
                </div>
                <div style={controlGroupStyle}>
                  <label htmlFor="roundtrip-idem-key">Idempotency key </label>
                  <input
                    id="roundtrip-idem-key"
                    value={roundTripIdemKey}
                    maxLength={120}
                    style={controlInputStyle}
                    onChange={(e) => setRoundTripIdemKey(e.target.value)}
                  />
                </div>
                <div style={controlGroupStyle}>
                  <label htmlFor="roundtrip-note">Proposal note </label>
                  <input
                    id="roundtrip-note"
                    value={roundTripNote}
                    maxLength={240}
                    placeholder="Optional audit note"
                    style={controlInputStyle}
                    onChange={(e) => setRoundTripNote(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  disabled={!roundTripFile || !roundTripIdemKey.trim()}
                  onClick={() =>
                    void runBusy(async () => {
                      if (!roundTripFile) return;
                      setWorkingPreview(null);
                      setFormalPreview(null);
                      const fd = new FormData();
                      fd.append('action', 'verify_import');
                      fd.append('projectId', projectId);
                      fd.append('templateCode', template.code);
                      fd.append('idempotencyKey', roundTripIdemKey.trim());
                      fd.append('conflictResolutionMode', roundTripMode);
                      if (roundTripNote.trim()) fd.append('changeNote', roundTripNote.trim());
                      fd.append('file', roundTripFile);
                      const response = await fetch('/api/uboq/templates/round-trip', {
                        method: 'POST',
                        body: fd,
                      });
                      if (!response.ok) {
                        await onRefreshRoundTrip().catch(() => undefined);
                        throw new Error(await readErrorMessage(response));
                      }
                      const verified = (await response.json()) as VerifiedRoundTripImportResult;
                      setRoundTripResult(verified);
                      await onRefreshRoundTrip();
                      setStatusNotice(
                        `Verified signed ${verified.templateCode} import (${verified.verificationStatus}, submission ${verified.submissionId}).`
                      );
                    })
                  }
                >
                  Verify &amp; stage signed import
                </button>
              </div>

              {roundTripResult && (
                <section
                  aria-label="Round-trip verification result"
                  style={{
                    overflowX: 'auto',
                    minWidth: 0,
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <p style={{ margin: '4px 0', overflowWrap: 'anywhere' }}>
                    Submission: <strong>{roundTripResult.submissionId}</strong> | Status:{' '}
                    <strong>{roundTripResult.verificationStatus}</strong> | Package:{' '}
                    <code>{roundTripResult.packageId}</code> | Changed rows:{' '}
                    <strong>
                      {roundTripResult.changedRowCount}/{roundTripResult.totalRowCount}
                    </strong>{' '}
                    (scope: {roundTripResult.nonFinancialChangeCount}, financial:{' '}
                    {roundTripResult.financialChangeCount}) | Canonical records mutated:{' '}
                    <strong>{roundTripResult.canonicalRecordsMutated}</strong>
                    {roundTripResult.idempotentReplay ? ' | Idempotent replay' : ''}
                  </p>
                  {roundTripResult.proposedChanges.length > 0 && (
                    <table>
                      <caption>Staged field-level change proposal</caption>
                      <thead>
                        <tr>
                          <th scope="col">Row</th>
                          <th scope="col">Item</th>
                          <th scope="col">Field</th>
                          <th scope="col">Class</th>
                          <th scope="col">Baseline</th>
                          <th scope="col">Proposed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roundTripResult.proposedChanges.map((chg) => (
                          <tr key={`${chg.rowKey}-${chg.fieldId}`}>
                            <td>{chg.rowNumber}</td>
                            <td>{chg.itemCode ?? chg.rowKey}</td>
                            <td>{chg.fieldHeading}</td>
                            <td>{chg.classification}</td>
                            <td>{String(chg.baselineValue ?? '')}</td>
                            <td>{String(chg.submittedValue ?? '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              )}
            </div>
          ) : (
            <p>
              Read-only or non-stage project role: signed round-trip package issuance and staging
              require intake/governance stage authorization.
            </p>
          )
        ) : (
          <p style={{ margin: 0, overflowWrap: 'anywhere' }}>
            Signed round-trip package issuance and controlled re-import verification apply strictly
            to <code>T0_MASTER_CONTRACT</code> and <code>T1_PHASE_BOQ</code>.
          </p>
        )}
      </fieldset>

      <p style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
        Approved BOQ snapshots, contract authorities, agency estimates, procurement resource
        requirements, certified accomplishments, progress billings, baseline schedules, commitments,
        cash-flow schedules, contractor target budgets, approved variation orders (T11), and
        treasury variance reconciliations (T12) remain strictly read-only across all T0–T12
        projections without mutating canonical <code>AwardedBOQItem</code> or{' '}
        <code>ConsolidatedBOQItem</code> baselines.
        {roundTripState.ratifiedPhaseD2Templates.length > 0 && (
          <>
            {' '}
            Phase D2 templates{' '}
            {roundTripState.ratifiedPhaseD2Templates
              .map((t) => `${t.templateCode} (${t.ratificationStatus})`)
              .join(' and ')}{' '}
            operate under internal ERP governance only without external agency statutory
            certification claims.
          </>
        )}
      </p>
      {busy && <p role="status">Preparing template…</p>}
      {statusNotice && <p role="status">{statusNotice}</p>}
      {error && <p role="alert">{error}</p>}

      {workingPreview && (
        <section
          aria-label="Template preview"
          style={{ overflowX: 'auto', minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          <h2>Preview</h2>
          <p style={{ overflowWrap: 'anywhere' }}>
            {workingPreview.rowCount} row(s).{' '}
            {workingPreview.approvedLineTotal !== null &&
              `Approved line total: ${workingPreview.approvedLineTotal}. `}
            {'summaryTotal' in workingPreview &&
              workingPreview.summaryTotal &&
              workingPreview.approvedLineTotal === null &&
              `${workingPreview.summaryTotal.label}: ${workingPreview.summaryTotal.amount}. `}
            {'variationRegisterSummary' in workingPreview &&
              workingPreview.variationRegisterSummary &&
              `Approved Client VOs: ${workingPreview.variationRegisterSummary.approvedClientVoCount} | Approved Subcon VOs: ${workingPreview.variationRegisterSummary.approvedSubconVoCount} | Client VO delta: ${workingPreview.variationRegisterSummary.clientVoRevenueDeltaTotal} | Revised contract value: ${workingPreview.variationRegisterSummary.revisedContractValueTotal}${
                workingPreview.variationRegisterSummary.subconCommitmentVoDeltaTotal !== null
                  ? ` | Subcon commitment VO delta: ${workingPreview.variationRegisterSummary.subconCommitmentVoDeltaTotal}`
                  : ''
              }. `}
            {'treasuryVarianceSummary' in workingPreview &&
              workingPreview.treasuryVarianceSummary &&
              `Basis: ${
                workingPreview.treasuryVarianceSummary.actualTreasuryLiquidityVerified
                  ? `Verified opening treasury cash (${workingPreview.treasuryVarianceSummary.openingEffectiveDateIso}${
                      workingPreview.treasuryVarianceSummary.openingTreasuryCashAmt !== null
                        ? `: ${workingPreview.treasuryVarianceSummary.openingTreasuryCashAmt}`
                        : ''
                    })`
                  : workingPreview.treasuryVarianceSummary.openingBalanceBasis ===
                      'REDACTED_NON_EXECUTIVE'
                    ? 'Executive treasury cash basis redacted for role'
                    : 'Zero-basis cumulative net project cash movement (no verified opening treasury cash — not available liquidity)'
              } | Receipts variance: ${workingPreview.treasuryVarianceSummary.receiptsVarianceTotal}${
                workingPreview.treasuryVarianceSummary.disbursementVarianceTotal !== null
                  ? ` | Disbursement variance: ${workingPreview.treasuryVarianceSummary.disbursementVarianceTotal}`
                  : ''
              }${
                workingPreview.treasuryVarianceSummary.actualTreasuryLiquidityVerified &&
                workingPreview.treasuryVarianceSummary.endingActualTreasuryClosingCash !== null
                  ? ` | Ending actual treasury closing cash (NO_SUM): ${workingPreview.treasuryVarianceSummary.endingActualTreasuryClosingCash} | Peak actual treasury gap (NO_SUM): ${workingPreview.treasuryVarianceSummary.peakActualTreasuryLiquidityGap}`
                  : !workingPreview.treasuryVarianceSummary.actualTreasuryLiquidityVerified &&
                      workingPreview.treasuryVarianceSummary
                        .endingCumulativeNetCashMovementZeroBasis !== null
                    ? ` | Ending cumulative net cash movement (zero basis, NO_SUM): ${workingPreview.treasuryVarianceSummary.endingCumulativeNetCashMovementZeroBasis} | Peak zero-basis net cash deficit (NO_SUM): ${workingPreview.treasuryVarianceSummary.peakCumulativeNetCashDeficitZeroBasis}`
                    : ''
              }. `}
            {'cashFlowSummary' in workingPreview &&
              workingPreview.cashFlowSummary &&
              !('treasuryVarianceSummary' in workingPreview && workingPreview.treasuryVarianceSummary) &&
              `Cutoff: ${workingPreview.cashFlowSummary.asOfCutoffDateIso} | Actual receipts: ${workingPreview.cashFlowSummary.actualCashReceiptsTotal}${
                workingPreview.cashFlowSummary.endingClosingCash !== null
                  ? ` | Ending closing cash (NO_SUM): ${workingPreview.cashFlowSummary.endingClosingCash} | Peak liquidity gap (NO_SUM): ${workingPreview.cashFlowSummary.peakLiquidityGap}`
                  : ''
              }. `}
            {'executiveMarginSummary' in workingPreview &&
              workingPreview.executiveMarginSummary &&
              `Awarded Ex-VAT: ${workingPreview.executiveMarginSummary.awardedContractTotalExVat} | Incurred Ex-VAT: ${workingPreview.executiveMarginSummary.incurredActualCostTotalExVat}${
                workingPreview.executiveMarginSummary.committedTotalExVat !== null
                  ? ` | Committed Ex-VAT: ${workingPreview.executiveMarginSummary.committedTotalExVat} | Paid Ex-VAT: ${workingPreview.executiveMarginSummary.paidDisbursedTotalExVat} | Outstanding obligation Ex-VAT: ${workingPreview.executiveMarginSummary.outstandingTotalObligationExVat} | Forecast EAC Ex-VAT: ${workingPreview.executiveMarginSummary.forecastEacTotalExVat}`
                  : ''
              }. `}
            {'layout' in workingPreview &&
              `Saved layout: ${workingPreview.layout.templateName} (v${workingPreview.layout.versionNumber}, ${workingPreview.layout.sharingScope}). `}
            {workingPreview.rowCount > 100 &&
              'Showing the first 100 rows; downloads include all rows.'}
          </p>
          <table>
            <caption>
              {template.name} — {template.sources.find((s) => s.id === sourceId)?.label}
            </caption>
            <thead>
              <tr>
                {workingPreview.projection.visibleColumns.map((c) => (
                  <th scope="col" key={c.fieldId}>
                    {c.heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workingPreview.projection.projectedRows.slice(0, 100).map((row, rowIndex) => (
                <tr
                  key={String(
                    row.__oserpMeta.vo_item_id ??
                      row.__oserpMeta.boq_line_id ??
                      row.__oserpMeta.activity_db_id ??
                      row.__oserpMeta.activity_id ??
                      row.__oserpMeta.canonical_resource_id ??
                      row.__oserpMeta.resource_id ??
                      row.__oserpMeta.period_index ??
                      row.__oserpMeta.quarter_index ??
                      row.__oserpMeta.group_code ??
                      row.__oserpMeta.contract_id ??
                      rowIndex
                  )}
                >
                  {workingPreview.projection.visibleColumns.map((c) => (
                    <td key={c.fieldId}>{String(row.visible[c.fieldId] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {formalPreview && (
        <section
          aria-label="Formal export preview"
          style={{ overflowX: 'auto', minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
        >
          <h2>Formal export preview</h2>
          <p style={{ overflowWrap: 'anywhere' }}>
            Contract: <strong>{formalPreview.contract.contractCode}</strong> | Layout:{' '}
            <strong>
              {formalPreview.layout.templateName} (v{formalPreview.layout.layoutVersionNumber})
            </strong>{' '}
            | Source: <strong>{formalPreview.source.sourceId}@{formalPreview.source.sourceVersion}</strong>{' '}
            | Contract link:{' '}
            <strong>{formalPreview.pricingAndBillingBasis.contractAssociationStatus}</strong>{' '}
            | Pricing/VAT:{' '}
            <strong>
              {formalPreview.pricingAndBillingBasis.pricingMethod} /{' '}
              {formalPreview.pricingAndBillingBasis.contractVatBasis}
            </strong>
            {formalPreview.approvedLineTotal !== null &&
              ` | Approved BOQ total: ${formalPreview.approvedLineTotal}`}
            {formalPreview.procurementBudgetTotal &&
              ` | Procurement budget ceiling: ${formalPreview.procurementBudgetTotal}`}
            {formalPreview.certifiedCurrentAmountTotal &&
              ` | Certified current work: ${formalPreview.certifiedCurrentAmountTotal}`}
            {formalPreview.totals.weightedPhysicalProgressPct &&
              ` | Weighted physical progress: ${formalPreview.totals.weightedPhysicalProgressPct}%`}
            {formalPreview.netCertifiedDueTotal &&
              ` | Net certified due: ${formalPreview.netCertifiedDueTotal}`}
            {formalPreview.clientVoRevenueDeltaTotal &&
              ` | Approved client VO delta: ${formalPreview.clientVoRevenueDeltaTotal}`}
            {formalPreview.totals.subconCommitmentVoDeltaTotal &&
              ` | Approved subcon VO delta: ${formalPreview.totals.subconCommitmentVoDeltaTotal}`}
            {formalPreview.totals.currentApprovedContractValue !== null &&
              ` | Current contract value: ${formalPreview.totals.currentApprovedContractValue}`}
            {formalPreview.provenance?.auditEventId &&
              ` | Audit: ${formalPreview.provenance.auditEventId}`}
            {formalPreview.outputSha256 &&
              ` | SHA-256: ${formalPreview.outputSha256.slice(0, 16)}…`}
          </p>
          <table>
            <caption>
              {formalPreview.contract.contractTitle} — {formalPreview.rowCount} row(s)
            </caption>
            <thead>
              <tr>
                {formalPreview.projection.visibleColumns.map((c) => (
                  <th scope="col" key={c.fieldId}>
                    {c.heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formalPreview.projection.projectedRows.slice(0, 100).map((row, rowIndex) => (
                <tr
                  key={String(
                    row.__oserpMeta.vo_item_id ??
                      row.__oserpMeta.boq_line_id ??
                      row.__oserpMeta.activity_db_id ??
                      row.__oserpMeta.activity_id ??
                      row.__oserpMeta.canonical_resource_id ??
                      row.__oserpMeta.resource_id ??
                      row.__oserpMeta.group_code ??
                      row.__oserpMeta.contract_id ??
                      rowIndex
                  )}
                >
                  {formalPreview.projection.visibleColumns.map((c) => (
                    <td key={c.fieldId}>{String(row.visible[c.fieldId] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
