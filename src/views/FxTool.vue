<template>
  <div>
    <div class="toolbar">
      <span class="note" v-if="sourceUpdatedAt">
        汇率日期：{{ dateOf(sourceUpdatedAt) }} · 数据来源：ExchangeRate-API（open.er-api.com，每日更新）
      </span>
      <span class="note" v-else>正在加载汇率…</span>
    </div>
    <el-alert
      v-if="stale"
      class="stale-alert"
      type="warning"
      :closable="false"
      show-icon
      title="当前显示的是缓存汇率，可能不是最新（暂时取不到新汇率，先用上次的）"
    />

    <el-card v-loading="loading" shadow="never" class="calc-card">
      <div class="calc-row">
        <el-input-number
          v-model="amount"
          class="amount"
          :min="0"
          :precision="2"
          :step="100"
          controls-position="right"
        />
        <el-select v-model="baseCode" class="sel" filterable @change="onBaseChange">
          <el-option
            v-for="c in baseOptions"
            :key="c.code"
            :value="c.code"
            :label="`${c.country} · ${c.currency} ${c.code}`"
          />
        </el-select>
        <span class="arrow">→</span>
        <el-select v-model="targetCode" class="sel" filterable>
          <el-option
            v-for="c in targetOptions"
            :key="c.code"
            :value="c.code"
            :label="`${c.country} · ${c.currency} ${c.code}`"
          />
        </el-select>
      </div>

      <div v-if="liveRate" class="result">
        <div class="result-amount">{{ formatMoney(result, targetCode) }}</div>
        <div class="rate-line">
          <span>1 {{ baseCode }} =</span>
          <el-input-number
            v-model="rateInput"
            class="rate-input"
            size="small"
            :min="0"
            :precision="6"
            :step="0.0001"
            controls-position="right"
          />
          <span>{{ targetCode }}</span>
          <el-tag v-if="isManual" type="warning" size="small">手动汇率</el-tag>
          <el-button v-if="isManual" size="small" text type="primary" @click="resetRate">恢复实时汇率</el-button>
        </div>
        <div class="note">反向：1 {{ targetCode }} = {{ formatRate(inverse) }} {{ baseCode }} · 换算仅供内部报价试算参考</div>
      </div>
      <el-empty v-else-if="!loading" description="暂无汇率数据" />
    </el-card>

    <h3 class="quick-title">常用币种速算（按上面的金额换算）</h3>
    <el-table :data="quickRows" stripe>
      <el-table-column label="币种" min-width="220">
        <template #default="{ row }">{{ row.country }} · {{ row.currency }} {{ row.code }}</template>
      </el-table-column>
      <el-table-column label="汇率" min-width="220">
        <template #default="{ row }">1 {{ baseCode }} = {{ formatRate(row.rate) }} {{ row.code }}</template>
      </el-table-column>
      <el-table-column label="换算价" min-width="180">
        <template #default="{ row }"><b>{{ formatMoney(row.converted, row.code) }}</b></template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && quickRows.length === 0" description="暂无可用的常用币种汇率" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { api, run } from '../api/client'
import { CURRENCIES, CURRENCY_BY_CODE, BASE_CODES, QUICK_CODES, formatMoney, formatRate } from '../utils/currencies'

const amount = ref(100)
const baseCode = ref('CNY')
const targetCode = ref('ZAR')
const rates = ref({})
const sourceUpdatedAt = ref('')
const stale = ref(false)
const loading = ref(false)
const rateInput = ref(null)

const baseOptions = computed(() => BASE_CODES.map((code) => CURRENCY_BY_CODE[code]).filter(Boolean))
// Targets = curated country list ∩ what the rate table actually has.
const targetOptions = computed(() =>
  CURRENCIES.filter((c) => c.code !== baseCode.value && rates.value[c.code] != null)
)

const liveRate = computed(() => {
  const r = rates.value[targetCode.value]
  return typeof r === 'number' && r > 0 ? r : null
})
// rateInput shadows the live rate: it follows the live rate whenever the
// pair (or the table) changes, and only diverges when the user edits it.
watch(liveRate, (v) => { rateInput.value = v }, { immediate: true })

const isManual = computed(() =>
  rateInput.value != null && liveRate.value != null && Math.abs(rateInput.value - liveRate.value) > 1e-12
)
const result = computed(() => (rateInput.value != null ? (Number(amount.value) || 0) * rateInput.value : 0))
const inverse = computed(() => (rateInput.value ? 1 / rateInput.value : null))

const quickRows = computed(() =>
  QUICK_CODES
    .filter((code) => code !== baseCode.value && rates.value[code] != null && CURRENCY_BY_CODE[code])
    .map((code) => ({
      ...CURRENCY_BY_CODE[code],
      rate: rates.value[code],
      converted: (Number(amount.value) || 0) * rates.value[code]
    }))
)

function dateOf(iso) {
  return String(iso || '').slice(0, 10)
}

function resetRate() {
  rateInput.value = liveRate.value
}

async function load(base) {
  loading.value = true
  try {
    const r = await run(api(`/api/admin/fx/rates?base=${base}`))
    if (r) {
      rates.value = r.rates || {}
      sourceUpdatedAt.value = r.sourceUpdatedAt || ''
      stale.value = !!r.stale
      // Keep the selected target valid for the new table.
      if (!targetOptions.value.some((c) => c.code === targetCode.value)) {
        const first = targetOptions.value[0]
        if (first) targetCode.value = first.code
      }
    }
  } finally {
    loading.value = false
  }
}

function onBaseChange() {
  load(baseCode.value)
}

onMounted(() => load(baseCode.value))
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
.note { color: var(--adm-text-3); font-size: 13px; }
.stale-alert { margin-bottom: 14px; }
.calc-card { margin-bottom: 22px; }
.calc-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.amount { width: 180px; }
.sel { width: 250px; }
.arrow { color: var(--adm-text-3); font-size: 18px; }
.result { margin-top: 22px; }
.result-amount { font-size: 40px; font-weight: 800; color: var(--adm-text); line-height: 1.15; }
.rate-line { display: flex; gap: 8px; align-items: center; margin: 12px 0 6px; color: var(--adm-text-2); font-size: 14px; flex-wrap: wrap; }
.rate-input { width: 190px; }
.quick-title { font-size: 16px; color: var(--adm-text); margin: 0 0 10px; }
</style>
