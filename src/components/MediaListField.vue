<template>
 <div class="media-list">
  <div class="actions">
   <el-upload multiple :show-file-list="false" :accept="kind === 'image' ? 'image/png,image/jpeg,image/webp,image/gif' : 'video/mp4,video/webm,video/quicktime'" :before-upload="upload">
    <el-button :loading="pending > 0">批量上传{{ kind === 'image' ? '图片' : '视频' }}</el-button>
   </el-upload>
   <el-input v-model="address" :placeholder="kind === 'image' ? '输入图片地址' : '输入视频地址'" :aria-label="kind === 'image' ? '新增图片地址' : '新增视频地址'" />
   <el-button :disabled="!address.trim() || pending > 0" @click="addUrl">添加地址</el-button>
  </div>
  <p class="hint">{{ kind === 'image' ? '最多20张，每张≤6MB，第一张作为封面。' : '最多10个，每个≤50MB，支持MP4 / WebM / MOV（MOV能否播放取决于浏览器编码支持）。' }} {{ pending ? '上传中，请等待完成后保存。' : '' }}</p>
  <div class="tiles">
   <div v-for="(url,index) in modelValue" :key="url" class="tile">
    <el-image v-if="kind === 'image'" :src="url" fit="contain" :preview-src-list="modelValue" :initial-index="index" />
    <video v-else :src="url" controls preload="metadata" />
    <span class="caption">{{ index + 1 }}{{ kind === 'image' && index === 0 ? ' · 封面' : '' }}</span>
    <div class="tile-actions">
     <el-button size="small" :disabled="index===0 || pending>0" @click="move(index,-1)">前移</el-button>
     <el-button size="small" :disabled="index===modelValue.length-1 || pending>0" @click="move(index,1)">后移</el-button>
     <el-button size="small" type="danger" :disabled="pending>0" @click="remove(index)">移除</el-button>
    </div>
   </div>
  </div>
 </div>
</template>
<script setup>
import {ref} from 'vue'
import {ElMessage} from 'element-plus'
import {api} from '../api/client'
const props=defineProps({modelValue:{type:Array,default:()=>[]},kind:{type:String,default:'image'}})
const emit=defineEmits(['update:modelValue','busy'])
const address=ref(''),pending=ref(0)
let queue=Promise.resolve()
function append(url){if(props.modelValue.includes(url))return;emit('update:modelValue',[...props.modelValue,url])}
function addUrl(){let url;try{url=new URL(address.value.trim());if(!['http:','https:'].includes(url.protocol))throw Error()}catch{ElMessage.warning('请填写有效的 http/https 地址');return}if(props.modelValue.length >= (props.kind==='image'?20:10)){ElMessage.warning('数量已达上限');return}append(url.href);address.value=''}
function move(i,d){const next=[...props.modelValue];[next[i],next[i+d]]=[next[i+d],next[i]];emit('update:modelValue',next)}
function remove(i){emit('update:modelValue',props.modelValue.filter((_,index)=>index!==i))}
function read(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('文件读取失败'));r.readAsDataURL(file)})}
function upload(file){
 const image=props.kind==='image',max=image?20:10;
 if(props.modelValue.length+pending.value>=max){ElMessage.warning('数量已达上限');return false}
 if(file.size>(image?6000000:50000000)){ElMessage.error(image?'每张图片不能超过6MB':'每个视频不能超过50MB');return false}
 const valid=image?/\.(png|jpe?g|webp|gif)$/i:/\.(mp4|webm|mov)$/i;
 if(!valid.test(file.name)){ElMessage.error('文件类型不支持');return false}
 pending.value++;emit('busy',true)
 queue=queue.then(async()=>{try{const dataBase64=await read(file);const r=await api('/api/admin/upload',{method:'POST',body:JSON.stringify({filename:file.name,dataBase64})});if(!r?.url)throw Error('上传未返回文件地址');append(r.url)}catch(e){ElMessage.error(file.name+'：'+e.message)}finally{pending.value--;emit('busy',pending.value>0)}})
 return false
}
</script>
<style scoped>
.media-list{width:100%}.actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.actions .el-input{flex:1;min-width:160px}.hint{font-size:12px;color:var(--adm-text-3);line-height:1.7}.tiles{display:flex;flex-wrap:wrap;gap:12px}.tile{width:240px;padding:8px;border:1px solid var(--adm-border);border-radius:8px}.tile .el-image,.tile video{width:100%;height:150px;object-fit:contain;background:#f5f5f5}.caption{font-size:12px}.tile-actions{display:flex;gap:4px;margin-top:6px}.tile-actions .el-button{margin:0}
</style>
