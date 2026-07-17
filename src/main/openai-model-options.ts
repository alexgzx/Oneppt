import {
  DEFAULT_THINKING_PARAMETER_MODE,
  isFreeModelProvider,
  normalizeThinkingParameterMode,
  requiresAuthOverride,
  type ThinkingParameterMode
} from '@shared/model-config'

export interface OpenAIModelOptionsInput {
  model: string
  apiKey: string
  baseUrl: string
  temperatureOptions: { temperature?: number }
  maxTokens: number
  useResponsesApi?: boolean
  thinkingParameterMode?: ThinkingParameterMode
  provider?: string
}

export const shouldDisableOpenAICompatibleThinking = (baseUrl: string): boolean => {
  const resolvedBaseUrl = baseUrl.trim()
  if (!resolvedBaseUrl) return false

  try {
    const hostname = new URL(resolvedBaseUrl).hostname.toLowerCase().replace(/\.$/, '')
    return hostname !== 'api.openai.com'
  } catch {
    return true
  }
}

export const normalizeOpenAIBaseUrl = (baseUrl: string, useResponsesApi = false): string => {
  const resolvedBaseUrl = baseUrl.trim().replace(/\/+$/, '')
  if (!useResponsesApi) return resolvedBaseUrl
  return resolvedBaseUrl.replace(/\/responses$/i, '')
}

export const resolveOpenAIThinkingModelKwargs = ({
  baseUrl,
  useResponsesApi = false,
  thinkingParameterMode = DEFAULT_THINKING_PARAMETER_MODE
}: {
  baseUrl: string
  useResponsesApi?: boolean
  thinkingParameterMode?: ThinkingParameterMode
}): Record<string, unknown> => {
  if (useResponsesApi) return {}

  const mode = normalizeThinkingParameterMode(thinkingParameterMode)
  if (mode === 'omit') return {}

  return shouldDisableOpenAICompatibleThinking(baseUrl) ? { thinking: { type: 'disabled' } } : {}
}

export const buildOpenAIModelOptions = ({
  model,
  apiKey,
  baseUrl,
  temperatureOptions,
  maxTokens,
  useResponsesApi = false,
  thinkingParameterMode = DEFAULT_THINKING_PARAMETER_MODE,
  provider
}: OpenAIModelOptionsInput) => {
  const resolvedBaseUrl = normalizeOpenAIBaseUrl(baseUrl, useResponsesApi)
  const modelKwargs = resolveOpenAIThinkingModelKwargs({
    baseUrl: resolvedBaseUrl,
    useResponsesApi,
    thinkingParameterMode
  })

  const isFree = isFreeModelProvider(provider || '')
  const requiresAuth = requiresAuthOverride(provider || '')

  const resolvedApiKey = requiresAuth
    ? ''
    : apiKey || 'placeholder'

  const configuration = resolvedBaseUrl
    ? {
        baseURL: resolvedBaseUrl,
        ...(requiresAuth ? { defaultHeaders: { Authorization: '' } } : {})
      }
    : undefined

  const result: Record<string, unknown> = {
    model,
    ...temperatureOptions,
    maxTokens,
    apiKey: resolvedApiKey,
    configuration,
    modelKwargs
  }

  return result as {
    model: string
    apiKey?: string
    temperature?: number
    maxTokens: number
    configuration?: { baseURL: string; defaultHeaders?: Record<string, string> }
    modelKwargs: Record<string, unknown>
  }
}

export const isOpenAIResponsesProvider = (provider: string): boolean => {
  return provider === 'openai-responses'
}
