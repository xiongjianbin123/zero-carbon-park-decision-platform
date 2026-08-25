import type { EvidenceAnswer, PolicyDocument, PolicySearchFilters, PolicySearchResult } from '@/types/policy'

export class PolicyApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
  }
}

export const fallbackPolicyCatalog: PolicyDocument[] = []

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  const body = await response.json()
  if (!response.ok) throw new PolicyApiError(body.code ?? 'REQUEST_FAILED', body.message ?? '请求失败。')
  return body as T
}

export async function listDocuments(): Promise<PolicyDocument[]> {
  try {
    const body = await request<{ documents: PolicyDocument[] }>('/api/policies')
    return body.documents
  } catch {
    try {
      const response = await fetch('/policies/catalog.json')
      if (!response.ok) return fallbackPolicyCatalog
      return await response.json() as PolicyDocument[]
    } catch { return fallbackPolicyCatalog }
  }
}

export async function searchPolicies(query: string, filters: PolicySearchFilters = {}): Promise<PolicySearchResult[]> {
  const body = await request<{ results: PolicySearchResult[] }>('/api/policies/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, filters }),
  })
  return body.results
}

export async function askPolicy(question: string, parkContext: string): Promise<EvidenceAnswer> {
  return request<EvidenceAnswer>('/api/qa', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, parkContext }),
  })
}
