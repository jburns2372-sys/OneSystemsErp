// Only persisted RBAC fields can authorize operations. Unknown actions never mean READ.
export const PERMISSION_FIELDS = [
  'canView', 'canCreate', 'canEditDraft', 'canSubmit', 'canReview', 'canRecommend',
  'canApprove', 'canReject', 'canReturnForCorrection', 'canCancel', 'canRevise',
  'canLock', 'canUnlockWithAuthorization', 'canReleasePayment', 'canMarkAsPaid',
  'canUploadAttachment', 'canDownloadAttachment', 'canPrint', 'canExport',
  'canDeleteDraft', 'canVoidRecord', 'canViewAuditLogs',
] as const;

export type PermissionField = typeof PERMISSION_FIELDS[number];

export const ACTION_PERMISSION_MAP = {
  READ: 'canView', VIEW: 'canView', CREATE: 'canCreate',
  EDIT: 'canEditDraft', UPDATE: 'canEditDraft', WRITE: 'canEditDraft', EDIT_DRAFT: 'canEditDraft',
  DELETE: 'canDeleteDraft', DELETE_DRAFT: 'canDeleteDraft',
  SUBMIT: 'canSubmit', REVIEW: 'canReview', RECOMMEND: 'canRecommend', APPROVE: 'canApprove',
  REJECT: 'canReject', RETURN_FOR_CORRECTION: 'canReturnForCorrection', CANCEL: 'canCancel',
  REVISE: 'canRevise', LOCK: 'canLock', UNLOCK: 'canUnlockWithAuthorization',
  UNLOCK_WITH_AUTHORIZATION: 'canUnlockWithAuthorization', RELEASE_PAYMENT: 'canReleasePayment',
  MARK_AS_PAID: 'canMarkAsPaid', UPLOAD: 'canUploadAttachment', UPLOAD_ATTACHMENT: 'canUploadAttachment',
  DOWNLOAD: 'canDownloadAttachment', DOWNLOAD_ATTACHMENT: 'canDownloadAttachment',
  PRINT: 'canPrint', EXPORT: 'canExport', VOID_RECORD: 'canVoidRecord', VIEW_AUDIT_LOGS: 'canViewAuditLogs',
  // Existing scheduling callers use these two legacy field spellings.
  CANEDIT: 'canEditDraft', CANDELETE: 'canDeleteDraft',
} as const satisfies Record<string, PermissionField>;

const ACTIONS: Readonly<Record<string, PermissionField>> = Object.freeze({
  ...Object.fromEntries(PERMISSION_FIELDS.map(field => [field.toUpperCase(), field])),
  ...ACTION_PERMISSION_MAP,
});

export function resolveAuthorizationAction(action: unknown): PermissionField | null {
  if (typeof action !== 'string') return null;
  const key = action.toUpperCase();
  return Object.hasOwn(ACTIONS, key) ? ACTIONS[key] : null;
}

export function isSystemAdminRole(role: string): boolean {
  return ['SUPER_ADMIN', 'SUPER ADMIN', 'SYSTEM_ADMIN'].includes(role);
}
