import { CheckCircle2, Circle, Loader2, Plus, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/Dialog'
import { FREE_MODEL_BASE_URLS } from '@shared/model-config.js'
import type { ModelConfig } from '../../lib/ipc'
import { ipc } from '../../lib/ipc'
import type { SettingsTranslate } from './types'

interface ScannedModel {
  id: string
  name: string
  isFree: boolean
}

interface ScanModelDialogProps {
  open: boolean
  provider: string
  existingConfigs: ModelConfig[]
  t: SettingsTranslate
  onClose: () => void
  onAddModels: (models: ScannedModel[], provider: string) => void
}

const PROVIDER_LABELS: Record<string, string> = {
  opencode: 'OpenCode',
  kilo: 'Kilo Code'
}

export function ScanModelDialog({
  open,
  provider,
  existingConfigs,
  t,
  onClose,
  onAddModels
}: ScanModelDialogProps): React.JSX.Element {
  const [scanning, setScanning] = useState(false)
  const [models, setModels] = useState<ScannedModel[]>([])
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setScanning(true)
      setModels([])
      setSelectedModels(new Set())
      setError(null)
      performScan()
    }
  }, [open, provider])

  const performScan = async (): Promise<void> => {
    const baseUrl = FREE_MODEL_BASE_URLS[provider]
    if (!baseUrl) {
      setError(t('settings.scanFailed', { message: 'Invalid base URL' }))
      setScanning(false)
      return
    }

    try {
      const result = await ipc.scanModels({ provider, baseUrl })
      if (result.success) {
        const freeModels = result.models.filter((m) => m.isFree)
        setModels(freeModels)
        const existingModelIds = new Set(existingConfigs
          .filter((c) => c.provider === provider)
          .map((c) => c.model))
        const defaultSelected = new Set(freeModels
          .filter((m) => !existingModelIds.has(m.id))
          .map((m) => m.id))
        setSelectedModels(defaultSelected)
      } else {
        setError(result.error || t('settings.scanFailed', { message: 'Unknown error' }))
      }
    } catch (err) {
      setError(t('settings.scanFailed', { message: err instanceof Error ? err.message : 'Unknown error' }))
    } finally {
      setScanning(false)
    }
  }

  const toggleModel = (modelId: string): void => {
    setSelectedModels((prev) => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        next.delete(modelId)
      } else {
        next.add(modelId)
      }
      return next
    })
  }

  const toggleAll = (): void => {
    if (selectedModels.size === models.length) {
      setSelectedModels(new Set())
    } else {
      setSelectedModels(new Set(models.map((m) => m.id)))
    }
  }

  const handleConfirm = (): void => {
    const selected = models.filter((m) => selectedModels.has(m.id))
    if (selected.length > 0) {
      onAddModels(selected, provider)
    }
    onClose()
  }

  const existingModelIds = new Set(existingConfigs
    .filter((c) => c.provider === provider)
    .map((c) => c.model))

  const hasNewModels = models.some((m) => !existingModelIds.has(m.id))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#5d7b4d]" />
            {t('settings.scanModels')} - {PROVIDER_LABELS[provider]}
          </DialogTitle>
          <DialogDescription>
            {scanning
              ? t('settings.scanning')
              : error
                ? error
                : hasNewModels
                  ? t('settings.scanFoundNew', { count: models.filter((m) => !existingModelIds.has(m.id)).length })
                  : t('settings.scanNoNew')}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {scanning ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5d7b4d]" />
              <p className="mt-3 text-sm text-muted-foreground">{t('settings.scanning')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-600">
              <X className="h-12 w-12" />
              <p className="mt-3 text-sm">{error}</p>
            </div>
          ) : models.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Circle className="h-12 w-12" />
              <p className="mt-3 text-sm">{t('settings.noFreeModels')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={toggleAll}
                className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-[#f5efe2]/60 rounded-md transition-colors"
              >
                <span>
                  {selectedModels.size === models.length
                    ? t('settings.deselectAll')
                    : t('settings.selectAll')}
                </span>
                <span className="text-[#5d7b4d]">{selectedModels.size}/{models.length}</span>
              </button>

              {models.map((model) => {
                const isExisting = existingModelIds.has(model.id)
                const isSelected = selectedModels.has(model.id)

                return (
                  <div
                    key={model.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      isExisting
                        ? 'border-[#d8cfbc]/50 bg-[#faf8f3]/50'
                        : isSelected
                          ? 'border-[#96b77f]/80 bg-[#eef6e8]'
                          : 'border-[#d8cfbc]/80 bg-[#fffdf8]/78 hover:border-[#d8cfbc]'
                    }`}
                  >
                    <button
                      onClick={() => !isExisting && toggleModel(model.id)}
                      disabled={isExisting}
                      className={`shrink-0 flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        isExisting
                          ? 'border-[#d8cfbc]/50 bg-[#e9e5dc] cursor-not-allowed'
                          : isSelected
                            ? 'border-[#5d7b4d] bg-[#5d7b4d]'
                            : 'border-[#d8cfbc] hover:border-[#5d7b4d]'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#33402a] truncate">{model.name}</p>
                        <span className="rounded-full bg-[#22c55e] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white shrink-0">
                          FREE
                        </span>
                        {isExisting && (
                          <span className="rounded-full bg-[#e9efde] px-1.5 py-0.5 text-[9px] uppercase text-[#506141] shrink-0">
                            {t('settings.alreadyExists')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{model.id}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              {t('settings.cancel')}
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={selectedModels.size === 0 || scanning}
          >
            {t('settings.addSelected', { count: selectedModels.size })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}