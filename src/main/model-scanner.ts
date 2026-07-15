import { OpenAI } from 'openai'
import {
  FREE_MODEL_SUFFIX_MAP,
  FREE_MODEL_BASE_URLS,
  isFreeModelProvider,
  requiresAuthOverride
} from '@shared/model-config'

export interface ScannedModel {
  id: string
  name: string
  isFree: boolean
}

export interface ModelScanResult {
  success: boolean
  models: ScannedModel[]
  error?: string
}

export interface ModelTestResult {
  success: boolean
  message: string
  latency?: number
}

export async function scanModels(
  provider: string,
  baseUrl: string,
  apiKey: string = ''
): Promise<ModelScanResult> {
  const freeSuffix = FREE_MODEL_SUFFIX_MAP[provider]
  try {
    const resolvedApiKey = requiresAuthOverride(provider)
      ? apiKey
      : apiKey || 'placeholder'
    const clientOptions: Record<string, unknown> = {
      baseURL: baseUrl,
      timeout: 10000,
      apiKey: resolvedApiKey
    }
    if (requiresAuthOverride(provider)) {
      clientOptions.defaultHeaders = { Authorization: '' }
    }
    const client = new OpenAI(clientOptions)

    const response = await client.models.list()
    const models: ScannedModel[] = []
    const seen = new Set<string>()

    for (const model of response.data) {
      const modelId = String(model.id || '').trim()
      if (!modelId || seen.has(modelId)) continue
      seen.add(modelId)

      const isFree = freeSuffix ? modelId.endsWith(freeSuffix) : false
      const displayName = modelId
        .replace(freeSuffix || '', '')
        .replace(/-/g, ' ')
        .replace(/\//g, ' - ')
        .replace(/:/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()

      models.push({
        id: modelId,
        name: displayName || modelId,
        isFree
      })
    }

    return {
      success: true,
      models: models.sort((a, b) => {
        if (a.isFree !== b.isFree) return a.isFree ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    }
  } catch (error) {
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function testModel(
  provider: string,
  model: string,
  baseUrl: string,
  apiKey: string = ''
): Promise<ModelTestResult> {
  const startTime = Date.now()

  try {
    const resolvedApiKey = requiresAuthOverride(provider)
      ? apiKey
      : apiKey || 'placeholder'
    const clientOptions: Record<string, unknown> = {
      baseURL: baseUrl,
      timeout: 15000,
      apiKey: resolvedApiKey
    }
    if (requiresAuthOverride(provider)) {
      clientOptions.defaultHeaders = { Authorization: '' }
    }
    const client = new OpenAI(clientOptions)

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10,
      temperature: 0
    })

    const latency = Date.now() - startTime

    if (response.choices && response.choices.length > 0) {
      return {
        success: true,
        message: 'Model connection test successful.',
        latency
      }
    }

    return {
      success: false,
      message: 'Empty response from model.'
    }
  } catch (error) {
    const latency = Date.now() - startTime
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      latency
    }
  }
}

export function getDefaultBaseUrl(provider: string): string {
  return FREE_MODEL_BASE_URLS[provider] || ''
}

export function isProviderScanable(provider: string): boolean {
  return isFreeModelProvider(provider)
}