export type PolicyStatus = 'effective' | 'trial' | 'drafting' | 'repealed'
export type PolicyLevel = 'national' | 'shanxi' | 'technical'
export type PolicyCategory = 'policy' | 'indicator' | 'accounting' | 'standard' | 'energy' | 'case'

export interface PolicyDocument {
  id: string
  title: string
  documentNumber?: string
  level: PolicyLevel
  category: PolicyCategory
  status: PolicyStatus
  issuers: string[]
  publishedAt: string
  sourceUrl: string
  localFile?: string
  localText?: string
  tags: string[]
  summary: string
  relatedProjectIds: string[]
}

export interface PolicyChunk {
  chunkId: string
  documentId: string
  page?: string
  text: string
}

export interface PolicySearchFilters {
  levels?: PolicyLevel[]
  categories?: PolicyCategory[]
  statuses?: PolicyStatus[]
}

export interface PolicySearchResult extends PolicyChunk {
  evidenceId: string
  title: string
  documentNumber?: string
  level: PolicyLevel
  category: PolicyCategory
  status: PolicyStatus
  issuers: string[]
  sourceUrl: string
  excerpt: string
  score: number
}

export interface EvidenceCitation {
  evidenceId: string
  documentId: string
  title: string
  page?: string
  sourceUrl: string
  excerpt: string
}

export interface EvidenceAnswer {
  answer: string
  citations: EvidenceCitation[]
}
