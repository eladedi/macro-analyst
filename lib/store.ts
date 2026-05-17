import { create } from 'zustand'

export type RegimeLabel =
  | 'Strong Risk-On'
  | 'Risk-On'
  | 'Early Risk-On'
  | 'Neutral / Mixed'
  | 'Weakening'
  | 'Risk-Off'
  | 'Panic / Stress'

export type Trend = 'improving' | 'stable' | 'deteriorating' | 'unknown'
export type Confidence = 'high' | 'medium' | 'low'
export type DataFreshness = 'good' | 'mixed' | 'stale'

export interface CategoryScore {
  category: string
  rawCategoryScore: number
  categoryWeight: number
  weightedContribution: number
}

export interface MetricSummary {
  metricId: string
  name: string
  value: number | null
  rawScore: number
  trend: 'up' | 'down' | 'flat' | 'unknown'
  source: string
  freshness: 'fresh' | 'delayed' | 'stale' | 'manual'
  confidence: Confidence
  weightedContribution: number
}

export interface Snapshot {
  id: string
  createdAt: string
  marketScore: number
  oscillatorValue: number
  regimeLabel: RegimeLabel
  trend: Trend
  confidence: Confidence
  dataFreshness: DataFreshness
  topPositiveSignals: string[]
  topNegativeSignals: string[]
  categoryScores: CategoryScore[]
  metrics: MetricSummary[]
}

interface AppStore {
  latestSnapshot: Snapshot | null
  isRefreshing: boolean
  setLatestSnapshot: (snapshot: Snapshot) => void
  setIsRefreshing: (v: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  latestSnapshot: null,
  isRefreshing: false,
  setLatestSnapshot: (snapshot) => set({ latestSnapshot: snapshot }),
  setIsRefreshing: (v) => set({ isRefreshing: v }),
}))
