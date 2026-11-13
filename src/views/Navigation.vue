<template>
  <el-card v-loading="loading">
    <div class="toolbar">
      <el-button type="primary" @click="addItem">新增导航</el-button>
      <el-button @click="restoreDefaults">恢复默认导航</el-button>
      <el-button :disabled="saving" @click="load">重新加载</el-button>
      <el-button type="primary" :loading="saving" :disabled="loading || !loaded" @click="save">保存导航</el-button>
    </div>
    <p class="help">管理前台顶部导航，包含配方搜索和公司简介。按表格顺序显示；关闭开关可隐藏。默认名称随前台语言切换，修改名称后使用自定义文字。保存后刷新前台生效。</p>
    <el-table :data="items" row-key="editorId" border>
      <el-table-column label="名称" min-width="220"><template #default="{ row }">
        <el-input v-model="row.label" placeholder="导航名称" @input="row.labelKey = ''" />
        <span v-if="row.labelKey" class="help">使用默认多语言名称</span>
      </template></el-table-column>
      <el-table-column label="显示" width="78"><template #default="{ row }"><el-switch v-model="row.enabled" :aria-label="row.label + '显示'" /></template></el-table-column>
      <el-table-column label="跳转类型" width="160"><template #default="{ row }">
        <el-select v-model="row.type" aria-label="跳转类型" placeholder="不跳转">
          <el-option label="不跳转" value="" /><el-option label="商品分类" value="category" />
          <el-option label="站内页面或区块" value="anchor" /><el-option label="外部链接" value="external" />
        </el-select>
      </template></el-table-column>
      <el-table-column label="跳转目标" min-width="240"><template #default="{ row }">
        <el-select v-if="row.type === 'category'" v-model="row.categoryId" filterable placeholder="选择分类" style="width:100%">
          <el-option v-for="c in categories" :key="c.id" :label="categoryPath(categories,c.id)" :value="String(c.id)" />
        </el-select>
        <el-select v-else-if="row.type === 'anchor'" v-model="row.link" placeholder="选择站内页面或区块" style="width:100%">
          <el-option v-for="target in targets" :key="target.value" :label="target.label" :value="target.value" />
        </el-select>
        <el-input v-else-if="row.type === 'external'" v-model="row.link" placeholder="https://example.com" />
        <span v-else class="help">仅显示名称</span>
      </template></el-table-column>
      <el-table-column label="操作" width="218"><template #default="{ $index }">
        <el-button size="small" :disabled="$index === 0" @click="move($index,-1)">上移</el-button>
        <el-button size="small" :disabled="$index === items.length - 1" @click="move($index,1)">下移</el-button>
        <el-button size="small" type="danger" plain @click="items.splice($index,1)">删除</el-button>
      </template></el-table-column>
      <template #empty>暂无导航。保存空列表后，前台不显示导航菜单。</template>
    </el-table>
  </el-card>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import { categoryPath } from '../utils/categories'
const items=ref([]), categories=ref([]), loading=ref(false), saving=ref(false), loaded=ref(false)
const targets=[{label:'配方搜索',value:'#formula'},{label:'公司简介',value:'#profile'},{label:'商品列表',value:'#catalogue'},{label:'品牌介绍',value:'#story'},{label:'联系方式',value:'#dealer'},{label:'询价表单',value:'#rfq'},{label:'回到顶部',value:'#top'}]
const labels=['礼品专区','自用专区','热门精选','涂料专区','案例','资讯']
let nextId=0
function normalize(item) {
 const link=String(item.link||'')
 const type=['category','anchor','external'].includes(item.type)?item.type:/^https?:\/\//i.test(link)?'external':link.startsWith('#')?'anchor':''
 return {...item,editorId:++nextId,label:String(item.label||''),labelKey:String(item.labelKey||''),enabled:item.enabled!==false,type,link,categoryId:String(item.categoryId||'')}
}
function defaults() { return labels.map((label,index)=>normalize({label,labelKey:'zones.'+index})).concat([
 normalize({label:'配方搜索',labelKey:'formulaSearch',type:'anchor',link:'#formula'}),
 normalize({label:'公司简介',labelKey:'companyProfile',type:'anchor',link:'#profile'})]) }
function addItem(){items.value.push(normalize({label:'',type:'anchor',link:'#catalogue'}))}
function restoreDefaults(){items.value=defaults()}
function move(index,direction){const next=index+direction;if(next<0||next>=items.value.length)return;[items.value[index],items.value[next]]=[items.value[next],items.value[index]]}
async function load(){
 loading.value=true;loaded.value=false
 try {
  const config=await api('/api/site-config')
  if(config.navigationConfigured===true) items.value=(config.navItems||[]).map(normalize)
  else {
   items.value=config.navItems?.length?config.navItems.map(normalize):defaults().slice(0,6)
   for(const item of defaults().slice(6)) if(!items.value.some(row=>row.link===item.link))items.value.push(item)
  }
  loaded.value=true
 }catch(e){ElMessage.error(e.message)}finally{loading.value=false}
 try{categories.value=(await api('/api/admin/categories'))||[]}catch{categories.value=[]}
}
async function save(){
 for(const item of items.value){
  if(!item.label.trim()){ElMessage.warning('请填写每条导航的名称');return}
  if(item.type==='category'&&!item.categoryId){ElMessage.warning('请选择商品分类');return}
  if(item.type==='anchor'&&!targets.some(t=>t.value===item.link)){ElMessage.warning('请选择站内页面或区块');return}
  if(item.type==='external'){try{const url=new URL(item.link);if(!['http:','https:'].includes(url.protocol))throw Error()}catch{ElMessage.warning('外部链接需为有效的 http 或 https 地址');return}}
 }
 saving.value=true
 try{
  const navItems=items.value.map(({editorId,...item})=>({...item,label:item.label.trim()}))
  await api('/api/admin/site-config',{method:'PUT',body:JSON.stringify({navItems,navigationConfigured:true})})
  ElMessage.success('导航已保存，刷新前台即可生效')
 }catch(e){ElMessage.error(e.message)}finally{saving.value=false}
}
onMounted(load)
</script>
<style scoped>
.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.help{color:var(--adm-text-3);font-size:12px;line-height:1.8;margin:6px 0 16px}
</style>
