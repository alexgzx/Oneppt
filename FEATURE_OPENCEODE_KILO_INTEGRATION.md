# OpenCode & Kilo Code 免鉴权模型接入方案

## 一、需求概述

在现有项目中增加免鉴权接入 OpenCode 和 Kilo Code 免费模型的功能，用户无需配置 API Key 即可直接使用这些免费模型进行对话。

### 功能目标

| 目标 | 说明 |
|------|------|
| 免鉴权接入 | 用户无需输入 API Key 即可使用 OpenCode 和 Kilo Code |
| 自动模型扫描 | 运行时自动扫描并识别免费模型 |
| 免费标识显示 | 前端区分显示免费模型和付费模型 |
| 内置模型列表 | 提供内置模型列表作为基础保障 |

---

## 二、技术方案

### 2.1 核心原理

**免鉴权机制**：通过设置 `require_api_key=False`，允许使用空字符串作为 API Key 调用 OpenAI 兼容的 API 端点。

**模型扫描机制**：调用 `/v1/models` API 获取模型列表，根据模型 ID 后缀自动标记免费模型。

### 2.2 后端实现

#### 2.2.1 定义 Provider 基类扩展

在 `providers/openai_provider.py` 中添加免费后缀扫描 Mixin：

```python
class _FreeSuffixProviderMixin:
    """Mixin for providers that mark models as free by suffix."""

    _FREE_SUFFIX = "-free"

    async def fetch_models(
        self,
        timeout: float = 5,
    ) -> List[ModelInfo]:
        """Fetch models and mark free ones by suffix."""
        try:
            client = self._client(timeout=timeout)
            payload = await client.models.list(timeout=timeout)
        except Exception:
            return []

        suffix = self._FREE_SUFFIX
        models: List[ModelInfo] = []
        seen: set[str] = set()
        for row in getattr(payload, "data", []) or []:
            model_id = str(getattr(row, "id", "") or "").strip()
            if not model_id or model_id in seen:
                continue
            seen.add(model_id)
            is_free = model_id.endswith(suffix)
            display_name = (
                model_id.removesuffix(suffix)
                .replace("-", " ")
                .replace("/", " - ")
                .title()
            )
            models.append(
                ModelInfo(
                    id=model_id,
                    name=display_name,
                    is_free=is_free,
                ),
            )
        return models
```

#### 2.2.2 定义 OpenCode Provider

```python
class OpenCodeProvider(_FreeSuffixProviderMixin, OpenAIProvider):
    """OpenCode provider with dynamic free model detection."""

    _FREE_SUFFIX = "-free"
```

#### 2.2.3 定义 Kilo Provider

```python
class KiloProvider(_FreeSuffixProviderMixin, OpenAIProvider):
    """Kilo Code provider with dynamic free model detection."""

    _FREE_SUFFIX = ":free"
```

#### 2.2.4 在 Provider Manager 中注册

在 `providers/provider_manager.py` 中添加：

```python
# 内置模型列表（作为基础保障）
OPENCODE_MODELS: List[ModelInfo] = [
    ModelInfo(
        id="deepseek-v4-flash-free",
        name="DeepSeek V4 Flash",
        supports_image=False,
        supports_video=False,
        probe_source="documentation",
        is_free=True,
    ),
    ModelInfo(
        id="mimo-v2.5-free",
        name="Mimo V2.5",
        supports_image=False,
        supports_video=False,
        probe_source="documentation",
        is_free=True,
    ),
    ModelInfo(
        id="nemotron-3-ultra-free",
        name="Nemotron 3 Ultra",
        supports_image=False,
        supports_video=False,
        probe_source="documentation",
        is_free=True,
    ),
    ModelInfo(
        id="nemotron-3-super-free",
        name="Nemotron 3 Super",
        supports_image=False,
        supports_video=False,
        probe_source="documentation",
        is_free=True,
    ),
]

KILO_MODELS: List[ModelInfo] = [
    ModelInfo(
        id="kilo-auto/free",
        name="Kilo Auto (Free Router)",
        supports_image=False,
        supports_video=False,
        probe_source="documentation",
        is_free=True,
    ),
    ModelInfo(
        id="nvidia/nemotron-3-ultra-550b-a55b:free",
        name="Nemotron 3 Ultra 550B",
        supports_image=False,
        supports_video=False,
        probe_source="documentation",
        is_free=True,
    ),
    ModelInfo(
        id="nvidia/nemotron-3-super-120b-a12b:free",
        name="Nemotron 3 Super 120B",
        supports_image=False,
        supports_video=False,
        probe_source="documentation",
        is_free=True,
    ),
    ModelInfo(
        id="poolside/laguna-m.1:free",
        name="Poolside Laguna M.1",
        supports_image=False,
        supports_video=False,
        probe_source="documentation",
        is_free=True,
    ),
]

# 注册 Provider 实例
PROVIDER_OPENCODE = OpenCodeProvider(
    id="opencode",
    name="OpenCode",
    base_url="https://opencode.ai/zen/v1",
    api_key_prefix="",
    models=OPENCODE_MODELS,
    require_api_key=False,
    meta={
        "base_url_options": [
            {"label": "OpenCode", "value": "https://opencode.ai/zen/v1"},
            {"label": "OpenCode Go", "value": "https://opencode.ai/zen/go/v1"},
        ],
        "is_free_tier": True,
    },
    freeze_url=False,
)

PROVIDER_KILO = KiloProvider(
    id="kilo",
    name="Kilo Code",
    base_url="https://api.kilo.ai/api/gateway",
    api_key_prefix="",
    models=KILO_MODELS,
    require_api_key=False,
    meta={"is_free_tier": True},
    freeze_url=True,
)
```

#### 2.2.5 将 Provider 加入注册列表

确保在 Provider Manager 的注册列表中添加这两个 provider：

```python
BUILTIN_PROVIDERS: List[Provider] = [
    # ... 其他 provider ...
    PROVIDER_OPENCODE,
    PROVIDER_KILO,
]
```

### 2.3 Provider 基类字段说明

确保 `providers/provider.py` 中的 `Provider` 类包含以下关键字段：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `require_api_key` | bool | True | 是否强制要求 API Key |
| `api_key_prefix` | str | "" | API Key 的前缀格式 |
| `support_model_discovery` | bool | False | 是否支持运行时模型发现 |
| `freeze_url` | bool | False | 是否冻结 base_url（不可编辑） |
| `meta` | dict | {} | 元信息，可包含 `is_free_tier` |

---

## 三、前端实现

### 3.1 Provider 类型定义

在前端类型定义文件中（如 `api/types/provider.ts`），确保包含以下字段：

```typescript
interface ProviderInfo {
    id: string;
    name: string;
    base_url: string;
    api_key: string;
    api_key_prefix: string;
    require_api_key: boolean;
    is_free_tier?: boolean;
    is_local?: boolean;
    is_custom?: boolean;
    models: ModelInfo[];
    support_model_discovery?: boolean;
    freeze_url?: boolean;
    // ... 其他字段
}

interface ModelInfo {
    id: string;
    name: string;
    is_free?: boolean;
    // ... 其他字段
}
```

### 3.2 模型选择器逻辑

在模型选择器组件中（如 `ModelSelector/index.tsx`），实现以下逻辑：

```typescript
// 筛选可用的 Provider
const eligibleProviders = providers.filter((p) => {
    const hasModels = (p.models?.length ?? 0) + (p.extra_models?.length ?? 0) > 0;
    // 免费层级：始终显示
    if (p.is_free_tier) return true;
    // 不需要 API Key 的 provider：只要有 base_url 就可用
    if (p.require_api_key === false) return !!p.base_url;
    // 需要 API Key 的 provider：必须配置了 API Key
    if (p.require_api_key ?? true) return !!p.api_key;
    return true;
});

// 按模型级别 is_free 分类
const { freeProviders, proProviders } = useMemo(() => {
    const freeMap = new Map<string, EligibleProvider>();
    const proMap = new Map<string, EligibleProvider>();
    for (const p of eligibleProviders) {
        const freeModels = p.models.filter((m) => m.is_free);
        const proModels = p.models.filter((m) => !m.is_free);
        // 有免费模型或免费层级且无模型时，加入免费列表
        if (freeModels.length > 0 || (p.is_free_tier && p.models.length === 0)) {
            freeMap.set(p.id, { ...p, models: freeModels });
        }
        // 付费模型：配置了 API Key 或不需要 Key
        if (
            proModels.length > 0 &&
            (p.has_api_key || p.require_api_key === false || p.is_custom || p.is_local)
        ) {
            proMap.set(p.id, { ...p, models: proModels });
        }
    }
    return { freeProviders: Array.from(freeMap.values()), proProviders: Array.from(proMap.values()) };
}, [eligibleProviders]);
```

### 3.3 UI 显示要点

1. **免费标识**：在 Provider 卡片上显示 "FREE" 标签
2. **API Key 输入框**：当 `require_api_key` 为 false 时，隐藏或禁用 API Key 输入框，显示"无需配置"提示
3. **模型分类**：将免费模型和付费模型分开显示
4. **在线状态**：显示 provider 是否在线（通过 connection check）

---

## 四、API 调用流程

### 4.1 模型列表获取流程

```
前端请求 → 后端 ProviderManager → OpenCodeProvider/KiloProvider
                                    → _FreeSuffixProviderMixin.fetch_models()
                                        → AsyncOpenAI.client.models.list()
                                            → GET https://opencode.ai/zen/v1/models
                                        → 解析模型列表，根据后缀标记 is_free
                                    → 返回模型列表
                                → 前端展示
```

### 4.2 对话请求流程

```
用户发送消息 → 前端构建请求 → 后端 Runner
                               → 获取 Provider 配置
                               → 创建 AsyncOpenAI 客户端（api_key=""）
                               → 调用 chat.completions.create()
                                   → POST https://opencode.ai/zen/v1/chat/completions
                               → 返回流式响应
                           → 前端展示
```

---

## 五、关键配置参数

### 5.1 OpenCode 配置

| 参数 | 值 | 说明 |
|------|------|------|
| `id` | "opencode" | Provider 唯一标识 |
| `name` | "OpenCode" | 显示名称 |
| `base_url` | "https://opencode.ai/zen/v1" | API 端点 |
| `api_key_prefix` | "" | 无前缀 |
| `require_api_key` | false | 不强制要求 API Key |
| `free_suffix` | "-free" | 免费模型后缀 |
| `is_free_tier` | true | 标记为免费层级 |
| `freeze_url` | false | 允许修改 base_url |

### 5.2 Kilo Code 配置

| 参数 | 值 | 说明 |
|------|------|------|
| `id` | "kilo" | Provider 唯一标识 |
| `name` | "Kilo Code" | 显示名称 |
| `base_url` | "https://api.kilo.ai/api/gateway" | API 端点 |
| `api_key_prefix` | "" | 无前缀 |
| `require_api_key` | false | 不强制要求 API Key |
| `free_suffix` | ":free" | 免费模型后缀 |
| `is_free_tier` | true | 标记为免费层级 |
| `freeze_url` | true | 冻结 base_url |

---

## 六、移植注意事项

### 6.1 依赖要求

确保项目已安装 `openai` 库（推荐使用 `async` 版本）：

```bash
pip install openai>=2.0.0
```

### 6.2 网络要求

确保服务器能访问以下域名：
- `opencode.ai`
- `api.kilo.ai`

### 6.3 安全考虑

1. 虽然这些 provider 不需要 API Key，但仍需确保请求是从可信后端发起
2. 建议在前端隐藏 base_url 的修改功能（设置 `freeze_url=True`）
3. 注意免费模型的请求频率限制

### 6.4 扩展性

此方案设计为可扩展的，如需接入其他类似的免鉴权 provider，只需：

1. 创建新的 Provider 类，继承 `_FreeSuffixProviderMixin` 和 `OpenAIProvider`
2. 设置自定义的 `_FREE_SUFFIX`
3. 在 Provider Manager 中注册

---

## 七、测试验证

### 7.1 后端测试

```python
# 测试模型列表获取
async def test_opencode_models():
    provider = OpenCodeProvider(
        id="test-opencode",
        name="Test OpenCode",
        base_url="https://opencode.ai/zen/v1",
        api_key_prefix="",
        models=[],
        require_api_key=False,
    )
    models = await provider.fetch_models()
    assert len(models) > 0
    assert any(m.is_free for m in models)

# 测试连接检查
async def test_opencode_connection():
    provider = OpenCodeProvider(...)
    success, message = await provider.check_connection()
    assert success, f"Connection failed: {message}"
```

### 7.2 前端测试

1. 确认模型选择器显示 OpenCode 和 Kilo Code Provider
2. 确认显示 "FREE" 标签
3. 确认 API Key 输入框显示 "无需配置"
4. 确认能看到免费模型列表
5. 确认能正常发起对话请求

---

## 八、参考实现

本方案基于 QwenPaw 项目的实现，核心文件包括：

- `src/qwenpaw/providers/openai_provider.py` - Provider 实现
- `src/qwenpaw/providers/provider_manager.py` - Provider 注册管理
- `src/qwenpaw/providers/provider.py` - Provider 基类定义
- `console/src/pages/Chat/ModelSelector/index.tsx` - 前端模型选择器
- `console/src/api/types/provider.ts` - 前端类型定义

---

## 九、总结

通过本方案，可以在现有项目中快速接入 OpenCode 和 Kilo Code 的免鉴权模型服务，主要工作包括：

1. **后端**：添加 `_FreeSuffixProviderMixin`、`OpenCodeProvider`、`KiloProvider` 类，并在 Provider Manager 中注册
2. **前端**：更新类型定义和模型选择器逻辑，支持免费模型的识别和显示
3. **配置**：设置 `require_api_key=False` 和 `is_free_tier=True` 标识

该方案具有良好的扩展性，可轻松适配其他类似的免鉴权模型服务。
