export const THINKING_PARAMETER_MODES = ['auto', 'omit'] as const

export type ThinkingParameterMode = (typeof THINKING_PARAMETER_MODES)[number]

export const DEFAULT_THINKING_PARAMETER_MODE: ThinkingParameterMode = 'auto'

export const normalizeThinkingParameterMode = (value: unknown): ThinkingParameterMode => {
  return THINKING_PARAMETER_MODES.includes(value as ThinkingParameterMode)
    ? (value as ThinkingParameterMode)
    : DEFAULT_THINKING_PARAMETER_MODE
}

export const FREE_MODEL_PROVIDERS = ['opencode', 'kilo'] as const
export type FreeModelProvider = (typeof FREE_MODEL_PROVIDERS)[number]

export const isFreeModelProvider = (provider: string): provider is FreeModelProvider => {
  return FREE_MODEL_PROVIDERS.includes(provider as FreeModelProvider)
}

export const FREE_MODEL_SUFFIX_MAP: Record<string, string> = {
  opencode: '-free',
  kilo: ':free'
}

export const FREE_MODEL_BASE_URLS: Record<string, string> = {
  opencode: 'https://opencode.ai/zen/v1',
  kilo: 'https://api.kilo.ai/api/gateway'
}

export const PROVIDER_CONFIG: Record<string, {
  baseUrl: string
  requiresAuthOverride: boolean
  freeSuffix: string
}> = {
  opencode: {
    baseUrl: 'https://opencode.ai/zen/v1',
    requiresAuthOverride: true,
    freeSuffix: '-free'
  },
  kilo: {
    baseUrl: 'https://api.kilo.ai/api/gateway',
    requiresAuthOverride: false,
    freeSuffix: ':free'
  }
}

export const requiresAuthOverride = (provider: string): boolean => {
  return PROVIDER_CONFIG[provider]?.requiresAuthOverride ?? false
}

export const BUILTIN_FREE_MODELS: Array<{
  id: string
  name: string
  provider: string
  model: string
  baseUrl: string
  apiKey: string
}> = [
  {
    id: 'builtin-opencode-deepseek',
    name: 'DeepSeek V4 Flash',
    provider: 'opencode',
    model: 'deepseek-v4-flash-free',
    baseUrl: 'https://opencode.ai/zen/v1',
    apiKey: ''
  },
  {
    id: 'builtin-opencode-mimo',
    name: 'Mimo V2.5',
    provider: 'opencode',
    model: 'mimo-v2.5-free',
    baseUrl: 'https://opencode.ai/zen/v1',
    apiKey: ''
  },
  {
    id: 'builtin-opencode-nemotron-ultra',
    name: 'Nemotron 3 Ultra',
    provider: 'opencode',
    model: 'nemotron-3-ultra-free',
    baseUrl: 'https://opencode.ai/zen/v1',
    apiKey: ''
  },
  {
    id: 'builtin-opencode-nemotron-super',
    name: 'Nemotron 3 Super',
    provider: 'opencode',
    model: 'nemotron-3-super-free',
    baseUrl: 'https://opencode.ai/zen/v1',
    apiKey: ''
  },
  {
    id: 'builtin-kilo-auto',
    name: 'Kilo Auto',
    provider: 'kilo',
    model: 'kilo-auto/free',
    baseUrl: 'https://api.kilo.ai/api/gateway',
    apiKey: ''
  },
  {
    id: 'builtin-kilo-nemotron-ultra',
    name: 'Nemotron 3 Ultra 550B',
    provider: 'kilo',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    baseUrl: 'https://api.kilo.ai/api/gateway',
    apiKey: ''
  },
  {
    id: 'builtin-kilo-nemotron-super',
    name: 'Nemotron 3 Super 120B',
    provider: 'kilo',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    baseUrl: 'https://api.kilo.ai/api/gateway',
    apiKey: ''
  },
  {
    id: 'builtin-kilo-laguna',
    name: 'Poolside Laguna M.1',
    provider: 'kilo',
    model: 'poolside/laguna-m.1:free',
    baseUrl: 'https://api.kilo.ai/api/gateway',
    apiKey: ''
  }
]

export const isBuiltinFreeModel = (id: string): boolean => {
  return BUILTIN_FREE_MODELS.some((m) => m.id === id)
}
