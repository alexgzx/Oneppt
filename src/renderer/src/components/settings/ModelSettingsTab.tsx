import { CheckCircle2, CircleHelp, ChevronDown, ChevronRight, Pencil, Plus, Search, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'
import type { ModelConfig } from '../../lib/ipc'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover'
import type { SettingsTranslate } from './types'
import { FREE_MODEL_PROVIDERS, isBuiltinFreeModel, isFreeModelProvider } from '@shared/model-config.js'

const MODEL_PROVIDER_LINKS = [
  { label: 'DeepSeek', url: 'https://platform.deepseek.com' },
  { label: 'Moonshot (Kimi)', url: 'https://platform.moonshot.cn' },
  { label: 'GLM (智谱)', url: 'https://open.bigmodel.cn' },
  { label: 'Qwen (通义千问)', url: 'https://bailian.console.aliyun.com/' },
  { label: 'Doubao (豆包)', url: 'https://console.volcengine.com/ark' },
  { label: 'Mimo (小米)', url: 'https://platform.xiaomimimo.com' },
  { label: 'MiniMax', url: 'https://www.minimaxi.com/' },
  { label: 'OpenAI', url: 'https://platform.openai.com' },
  { label: 'Claude (Anthropic)', url: 'https://console.anthropic.com' },
  { label: 'Google Gemini', url: 'https://ai.google.dev' },
  { label: 'OpenCode', url: 'https://opencode.ai' },
  { label: 'Kilo Code', url: 'https://kilo.ai' }
]

const PROVIDER_LABELS: Record<string, string> = {
  opencode: 'OpenCode',
  kilo: 'Kilo Code',
  openai: 'OpenAI',
  'openai-responses': 'OpenAI Responses',
  anthropic: 'Anthropic',
  google: 'Google'
}

interface ModelSettingsTabProps {
  activeModelConfig?: ModelConfig
  activatingId: string | null
  deletingId: string | null
  testingId: string | null
  scanningProvider: string | null
  testResults: Record<string, { success: boolean; message: string; latency?: number } | null>
  modelConfigs: ModelConfig[]
  t: SettingsTranslate
  onActivate: (id: string) => void
  onCreate: () => void
  onDelete: (config: ModelConfig) => void
  onEdit: (config: ModelConfig) => void
  onTest: (config: ModelConfig) => void
  onScanModels: (provider: string) => void
}

export function ModelSettingsTab({
  activeModelConfig,
  activatingId,
  deletingId,
  testingId,
  scanningProvider,
  testResults,
  modelConfigs,
  t,
  onActivate,
  onCreate,
  onDelete,
  onEdit,
  onTest,
  onScanModels
}: ModelSettingsTabProps): React.JSX.Element {
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set(['opencode', 'kilo']))

  const toggleProvider = (provider: string): void => {
    setExpandedProviders((prev) => {
      const next = new Set(prev)
      if (next.has(provider)) {
        next.delete(provider)
      } else {
        next.add(provider)
      }
      return next
    })
  }

  const groupedConfigs = modelConfigs.reduce((acc, config) => {
    if (!acc[config.provider]) {
      acc[config.provider] = []
    }
    acc[config.provider].push(config)
    return acc
  }, {} as Record<string, ModelConfig[]>)

  const freeProviders = FREE_MODEL_PROVIDERS.filter((p) => groupedConfigs[p]?.length > 0)
  const otherConfigs = modelConfigs.filter((c) => !FREE_MODEL_PROVIDERS.includes(c.provider as any))

  const renderModelCard = (config: ModelConfig): React.JSX.Element => {
    const isFree = isBuiltinFreeModel(config.id) || isFreeModelProvider(config.provider)
    const testResult = testResults[config.id]
    const isTesting = testingId === config.id

    return (
      <div
        key={config.id}
        className={
          config.active
            ? 'flex flex-col gap-2 rounded-lg border border-[#96b77f]/80 bg-[#eef6e8] p-3 shadow-[inset_3px_0_0_#6f8f64] sm:flex-row sm:items-center sm:justify-between'
            : 'flex flex-col gap-2 rounded-lg border border-[#d8ccb5]/80 bg-[#fffdf8]/78 p-3 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {config.active && <CheckCircle2 className="h-4 w-4 text-[#5d7b4d]" />}
            <p className="font-medium text-[#33402a]">{config.name}</p>
            {isFree && (
              <span className="rounded-full bg-[#22c55e] px-2 py-0.5 text-[10px] font-semibold uppercase text-white shadow-sm">
                FREE
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{config.model}</p>
          {config.baseUrl && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{config.baseUrl}</p>
          )}
          {testResult && (
            <p
              className={`mt-1 text-[11px] ${
                testResult.success ? 'text-[#4f6b45]' : 'text-[#b45309]'
              }`}
            >
              {testResult.success
                ? t('settings.testSuccess', { latency: testResult.latency })
                : t('settings.testFailed', { message: testResult.message })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            size="sm"
            variant={config.active ? 'secondary' : 'outline'}
            disabled={config.active || activatingId === config.id}
            onClick={() => onActivate(config.id)}
          >
            {config.active ? t('settings.activeModel') : t('settings.activateModel')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTest(config)}
            disabled={isTesting}
          >
            <Zap className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(config)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={deletingId === config.id}
            onClick={() => onDelete(config)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex-row items-center justify-between p-5 pb-3">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-base">
            {t('settings.modelAccess')}
            <Popover>
              <PopoverTrigger asChild>
                <CircleHelp className="h-3.5 w-3.5 cursor-pointer text-muted-foreground/50 transition-colors hover:text-foreground" />
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-auto max-w-xs border-[#d8cfbc]/80 bg-[#fffdf8] p-3"
              >
                <p className="mb-2 text-[11px] font-semibold text-[#3e4a32]">
                  {t('settings.modelHelpTitle')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MODEL_PROVIDER_LINKS.map((item) => (
                    <a
                      key={item.url}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-[#d8cfbc]/80 bg-[#f5efe2]/60 px-2 py-1 text-[11px] text-[#5b6b4d] transition-colors hover:border-[#96b77f]/60 hover:bg-[#e8f0de] hover:text-[#3e4a32]"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </CardTitle>
          {activeModelConfig && (
            <span className="mt-2 inline-flex max-w-full truncate rounded-full border border-[#96b77f]/55 bg-[#eef6e8] px-2.5 py-1 text-xs font-medium text-[#4f6b45]">
              {t('settings.currentActiveModel', { name: activeModelConfig.name })}
            </span>
          )}
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('settings.addModel')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        {freeProviders.map((provider) => {
          const configs = groupedConfigs[provider] || []
          const isExpanded = expandedProviders.has(provider)

          return (
            <div key={provider} className="rounded-lg border border-[#d8cfbc]/80 bg-[#fffdf8]/78 overflow-hidden">
              <button
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-[#f5efe2]/60 transition-colors"
                onClick={() => toggleProvider(provider)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#5d7b4d]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#5d7b4d]" />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#33402a]">{PROVIDER_LABELS[provider]}</span>
                    <span className="rounded-full bg-[#22c55e] px-2 py-0.5 text-[10px] font-semibold uppercase text-white shadow-sm">
                      FREE
                    </span>
                    <span className="rounded-full bg-[#e9efde] px-2 py-0.5 text-[11px] uppercase text-[#506141]">
                      {configs.length} {t('settings.models')}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onScanModels(provider)
                  }}
                  disabled={scanningProvider === provider}
                >
                  <Search className="h-4 w-4" />
                  {scanningProvider === provider ? t('settings.scanning') : t('settings.scanModels')}
                </Button>
              </button>

              {isExpanded && (
                <div className="border-t border-[#d8cfbc]/60 bg-[#fffdf8]/90">
                  <div className="p-3 space-y-2">
                    {configs.map((config) => renderModelCard(config))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {otherConfigs.length > 0 && (
          <div className="rounded-lg border border-[#d8cfbc]/80 bg-[#fffdf8]/78 overflow-hidden">
            <button
              className="flex w-full items-center justify-between px-4 py-3 hover:bg-[#f5efe2]/60 transition-colors"
              onClick={() => toggleProvider('other')}
            >
              <div className="flex items-center gap-3">
                {expandedProviders.has('other') ? (
                  <ChevronDown className="h-4 w-4 text-[#5d7b4d]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#5d7b4d]" />
                )}
                <span className="font-medium text-[#33402a]">{t('settings.customModels')}</span>
                <span className="rounded-full bg-[#e9efde] px-2 py-0.5 text-[11px] uppercase text-[#506141]">
                  {otherConfigs.length} {t('settings.models')}
                </span>
              </div>
            </button>
            {expandedProviders.has('other') && (
              <div className="border-t border-[#d8cfbc]/60 bg-[#fffdf8]/90 p-3 space-y-2">
                {otherConfigs.map((config) => renderModelCard(config))}
              </div>
            )}
          </div>
        )}

        {modelConfigs.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#d8ccb5]/85 bg-[#fff9ef]/70 p-6 text-sm text-muted-foreground">
            {t('settings.noModels')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}