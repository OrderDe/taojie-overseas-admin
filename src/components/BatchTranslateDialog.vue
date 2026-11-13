<template>
  <!-- Shared progress dialog for the「批量翻译未译名称」button on the
       products / categories / brands lists. Opening the dialog starts
       the run (via utils/batchTranslate.js, MyMemory pinned); closing
       it mid-run is disabled so a half-finished batch is never hidden.
       Emits `done` when the run ends so the list page can reload. -->
  <el-dialog
    v-model="visible"
    :title="`批量翻译未译名称（${entityLabel}）`"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="!running"
    :show-close="!running"
    @closed="onClosed"
  >
    <el-alert
      v-if="quotaStopped"
      class="quota-alert"
      type="error"
      :closable="false"
      show-icon
      title="可能今日免费额度已用完，已完成的部分都已保存，过段时间或明天再点一次会接着补剩下的"
    />
    <div class="progress-line">
      已处理 {{ state.processed }} / 共 {{ state.total }} 条 · 已补齐 {{ state.filled }} 条 · 失败 {{ state.failedCount }} 项
    </div>
    <el-progress
      :percentage="percentage"
      :status="finished && !quotaStopped ? 'success' : undefined"
      :stroke-width="14"
    />
    <p v-if="!finished" class="note">正在用 MyMemory 免费接口逐条翻译并保存，请不要关闭页面…</p>
    <template v-else>
      <p class="summary">
        共 {{ summary.total }} 条：需补译 {{ summary.candidates }} 条，已跳过（已全部译完或无中文名）
        {{ summary.skipped }} 条，本次补齐并保存 {{ summary.filled }} 条<template v-if="quotaStopped">，因疑似额度用完提前停止</template>。
      </p>
      <div v-if="summary.failures.length" class="fail-box">
        <div class="fail-title">失败明细（{{ summary.failures.length }} 项）</div>
        <ul class="fail-list">
          <li v-for="(f, i) in summary.failures" :key="i">
            「{{ f.name }}」<template v-if="f.lang"> · {{ f.lang }}</template>：{{ f.message }}
          </li>
        </ul>
      </div>
    </template>
    <template #footer>
      <el-button :disabled="running" @click="visible = false">{{ finished ? '关闭' : '取消' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { runBatchTranslate } from '../utils/batchTranslate'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  kind: { type: String, required: true },
  entityLabel: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'done'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const running = ref(false)
const finished = ref(false)
const quotaStopped = ref(false)
const state = reactive({ total: 0, processed: 0, filled: 0, failedCount: 0 })
const summary = ref({ total: 0, candidates: 0, skipped: 0, filled: 0, failures: [] })

const percentage = computed(() =>
  state.total ? Math.round((state.processed / state.total) * 100) : (finished.value ? 100 : 0)
)

// Opening the dialog starts the batch; the list-page button is the
// only entry point, so there is no separate "start" step to forget.
watch(() => props.modelValue, (open) => {
  if (open && !running.value) start()
})

async function start() {
  running.value = true
  finished.value = false
  quotaStopped.value = false
  Object.assign(state, { total: 0, processed: 0, filled: 0, failedCount: 0 })
  try {
    const s = await runBatchTranslate(props.kind, (p) => Object.assign(state, p))
    summary.value = s
    quotaStopped.value = s.quotaStopped
    if (!s.candidates) ElMessage.info('没有需要补译的名称（都已译完或没有中文名）')
  } catch (e) {
    summary.value = { total: 0, candidates: 0, skipped: 0, filled: 0, failures: [{ name: props.entityLabel, message: e.message || '批量翻译失败' }] }
    ElMessage.error(e.message || '批量翻译失败')
  } finally {
    running.value = false
    finished.value = true
  }
}

function onClosed() {
  if (finished.value) emit('done')
}
</script>

<style scoped>
.quota-alert { margin-bottom: 14px; }
.progress-line { margin-bottom: 8px; color: var(--adm-text); font-size: 14px; }
.note { color: var(--adm-text-3); font-size: 13px; margin: 10px 0 0; }
.summary { color: var(--adm-text-2); font-size: 14px; line-height: 1.6; margin: 12px 0 0; }
.fail-box { margin-top: 12px; }
.fail-title { font-weight: 600; color: var(--adm-text); margin-bottom: 6px; }
.fail-list { margin: 0; padding-left: 18px; max-height: 180px; overflow: auto; color: var(--el-color-danger); font-size: 13px; line-height: 1.7; }
</style>
