<template>
  <!-- One input per language for a names map {en, zh, es, fr, pt}. -->
  <el-form-item v-for="lang in LANGS" :key="lang.key" :label="lang.label">
    <el-input v-model="model[lang.key]" :placeholder="lang.label" />
  </el-form-item>
</template>

<script setup>
import { LANGS } from '../utils/names'

defineProps({
  model: { type: Object, required: true }
})
</script>
