import { useStorage } from "@plasmohq/storage/hook"

import {
  auditResultKey,
  auditResultStorage,
  type AuditSummary
} from "~features/global-mode"

/** Live-synced Global Mode audit result for `hostname`, read from the same storage the content script writes to. */
export function useAuditSummary(
  hostname: string | undefined
): AuditSummary | undefined {
  const [summary] = useStorage<AuditSummary | undefined>(
    { key: auditResultKey(hostname ?? ""), instance: auditResultStorage },
    undefined
  )
  return summary
}
