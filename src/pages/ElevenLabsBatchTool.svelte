<script lang="ts">
  import * as ElevenLabsAPI from '../lib/ElevenLabsAPI'
  import { readTextFile, exists, writeBinaryFile, removeFile, createDir, removeDir } from '@tauri-apps/api/fs';
  import { open, save } from '@tauri-apps/api/dialog';
  import { MessageBoard } from '../lib/MessageBoard'
  import { addVoice, clearVoices, voices, setSelectedVoiceByName, selectedVoice } from '../VoiceStore'
  import { addFile, clearFiles, files } from '../TopicFilesStore'
  import { type UserInfo, jsonToUserInfo } from '../lib/Interfaces/UserInfo';
  import { executeFFmpegCommand } from '../lib/FFmpegAPI';
  import { executeFaceFXWrapperCommand } from '../lib/FaceFXWrapperAPI';
  import { jsonToModel, type Model } from '../lib/Interfaces/Models';
  import { modelsStore, pushModel, selectedModelStore, setSelectedModelByName } from '../ModelStore';

  const log = new MessageBoard(["Enter your ElevenLabs API Key, then click apply."])
  let logs: string[]
  log.messages.subscribe((messages) => {
    logs = messages
  })

  enum Step { IDLE, KEY, VOICE, TOPICS, READY, GENERATING }
  let CurrentStep: Step = Step.IDLE

  let APIKey: string
  let currentUserInfo: UserInfo
  let stability: number = 75
  let clarity: number = 75
  let selectedVoiceName: string
  let selectedOutputPath: string
  let selectedFonixDataPath: string
  let selectedModelName: string
  let topicsToProcess: string[] = []
  let topicsHasProcessed: string[] = []
  let saveLipFiles: boolean = true
  let elevenModels: Model[] = []

  $: {
    elevenModels = $modelsStore;
  }

  async function apply(){
    if(CurrentStep.valueOf() > 0){
      log.clear()
      CurrentStep = Step.IDLE
      APIKey = undefined
      clearVoices()
      clearFiles()
      stability = 75
      clarity = 75
      topicsToProcess = []
      topicsHasProcessed = []
    }else{
      const userVoices = await ElevenLabsAPI.getVoices(APIKey)
      const axios = userVoices.axios
      if(userVoices.return == "error"){
        const status = axios.response.status
        if(status == 401 && axios.response.data.detail.status == "invalid_api_key") {
          log.message("You have entered an invalid ElevenLabs API key.")
        }else{
          log.message("Unhandled error "+status+" to getVoices() with response "+axios.response.data.detail.status)
        }
      }else{
        if(axios.status == 200){ 
          CurrentStep = Step.KEY
          const voicesJson = axios.data.voices
          voicesJson.forEach((index: { name: string; voice_id: string; preview_url: string; category: string; }) => {
            addVoice({voice_id: index.voice_id, voice_name: index.name, voice_preview: index.preview_url, voice_category: index.category})
          })
          applyUserInfo()
          getModels()
          log.message("Please select a voice from the dropdown above.")
        }else{
          log.message("Something went wrong with getVoices(), status is "+axios.status)
        }
      }
    }
  }

  async function applyUserInfo() {
    const userInfo = await ElevenLabsAPI.getUserInfo(APIKey)
    const axios = userInfo.axios;
    if(userInfo.return == "error"){
      const status = axios.response.status
      log.message("Unhandled error "+status+" to getUserInfo() with response "+axios.response.data.detail.status)
    }else{
      if(axios.status == 200){
        console.log(axios.data)
        currentUserInfo = jsonToUserInfo(axios.data)
      }else{
        log.message("Something went wrong with getUserInfo(), status is "+axios.status)
      }
    }
  }

  async function getModels() {
    const models = await ElevenLabsAPI.getModels(APIKey)
    const axios = models.axios;
    if(models.return == "error"){
      const status = axios.response.status
      log.message("Unhandled error "+status+" to getModels() with response "+axios.response.data.detail.status)
    }else{
      if(axios.status == 200){
        const modelsJson = axios.data
        modelsJson.forEach(json=>{
          pushModel(jsonToModel(json))
        })
        console.log(elevenModels)
      }else{
        log.message("Something went wrong with getUserInfo(), status is "+axios.status)
      }
    }
  }

  function changeSelectedVoiceName() {
    setSelectedVoiceByName(selectedVoiceName.split(' (')[0])
    const message = "Select the model that should be used for generating your voices"
    if(!(logs.includes(message))){
      log.message(message)
    }
  }

  async function changeFonixDataPath() {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'FonixData',
        extensions: ['cdf']
      }]
    })

    if(Array.isArray(selected)) {
      selected.forEach((file) => {
        selectedFonixDataPath = file
      })
    } else if (selected === null) {
      log.message("FonixData.cdf was not selected.")
    } else {
      selectedFonixDataPath = selected as string
    }

    log.message("Selected "+selectedFonixDataPath+" as fonix")
    if(selectedOutputPath)
      CurrentStep = Step.READY
  }

  async function selectElevenTopicFiles() {
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Topics',
        extensions: ['txt']
      }]
    })
    if(Array.isArray(selected)) {
      selected.forEach((file) => {
        const filePath = file.lastIndexOf('\\');
        const fileName = file.substring(filePath+1)
        log.message(fileName+" has been added to the topic files.")
        if(selectedOutputPath){
          CurrentStep = Step.READY
        }
        if(CurrentStep.valueOf() < 3){
          CurrentStep = Step.TOPICS
        }
        addFile(file)
        processTopics(file)
      })
    } else if (selected === null) {
      log.message("No topics were selected.")
    }
  }

  async function processTopics(file: string){
    const contents = await readTextFile(file);
    contents.split('\n').forEach((line) => {
      topicsToProcess.push(line)
    })
  }
  
  function clearTopicFiles(){
    clearFiles()
    topicsToProcess = []
    log.message("Topic files selection cleared.")
    CurrentStep = Step.VOICE
  }

  async function changeOutputPath() {
    const selectedFolder = await open({
          directory: true,
          multiple: false,
    })
    selectedOutputPath = selectedFolder.toString()
    log.message("Output path set to "+selectedOutputPath)
    CurrentStep = Step.READY
  }

  async function toggleGeneration() {
    if(saveLipFiles && !selectedFonixDataPath){
      log.message("Please select a FonixData file")
      return
    }
    if(CurrentStep != Step.GENERATING){
      console.log(JSON.stringify(currentUserInfo))
      if($selectedVoice.voice_category == "cloned" && currentUserInfo.subscription.can_use_instant_voice_cloning == false){
        log.message("You are trying to use a cloned voice, your subscription tier does not allow you to use cloned voices.")
      }else{
        startGeneration()
      }
    }else{
      CurrentStep = Step.READY
      stopGeneration()
      log.message("Generation stopped.")
    }
  }

  async function startGeneration() {
    CurrentStep = Step.GENERATING;
    for (const topic of topicsToProcess) {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (CurrentStep != Step.GENERATING) {
        stopGeneration();
        return;
      }

      if (topicsHasProcessed.includes(topic)) {
        continue;
      }

      const readName = parseForParentheses(topic.trim())
      const fileName = parseForSpecialCharacters(readName)
      const filePath: string = selectedOutputPath + '\\' + fileName + '.mp3'
      const wavFilePath: string = selectedOutputPath + '\\' + fileName + '.wav'
      const lipFilePath: string = selectedOutputPath + '\\' + fileName + '.lip'
      const tempPath = selectedOutputPath+"\\temp"
      if(saveLipFiles){
        createDir(tempPath)
      }
      await exists(wavFilePath).then(async (exists) => {
        if(!exists){
          log.message("Generating \""+readName+"\"");
          topicsHasProcessed.push(topic);

          const postTTS = await ElevenLabsAPI.postTextToSpeech(APIKey, $selectedModelStore, $selectedVoice.voice_id, readName, stability, clarity);

          if (postTTS.return != "error") {
            await writeBinaryFile({ path: filePath, contents: new Uint8Array(postTTS.axios.data)})
            await executeFFmpegCommand(filePath, wavFilePath)
            await removeFile(filePath)
            if(saveLipFiles) {
              await executeFaceFXWrapperCommand(selectedFonixDataPath, wavFilePath, tempPath+"\\"+fileName+".wav", lipFilePath, topic.trim())
            }
          } else {
            log.message("There was an unknown error while generating the topic Error: " + postTTS.axios.status);
          }

          if (topicsHasProcessed.length === topicsToProcess.length) {
            log.message("Generation is done!");
            stopGeneration();
            return;
          }
        }else{
          if(topicsToProcess.indexOf(topic) === topicsToProcess.length - 1){
            log.message("Generation is done!");
            stopGeneration();
            return;
          }
          log.message("Skipping \""+readName+"\", it already exists")
        }
      })
    }
  }

  function stopGeneration() {
    CurrentStep = Step.READY
    const tempPath = selectedOutputPath+"\\temp"
    if(exists(tempPath))
      removeDir(tempPath, {recursive: true})
    topicsHasProcessed = []
  }

  function parseForSpecialCharacters(input: string): string {
    const regex = /[\s\\/:*?"<>|]/g
    input = input.replace(regex, '_');
    return input;
  }

  function parseForParentheses(input: string): string {
    return input.split(' (')[0];
  }

  function changeSelectedModelName() {
    setSelectedModelByName(selectedModelName)
    CurrentStep = Step.VOICE
    const message = "Import your topics text files using the \"Select topic files\" button."
    if(!(logs.includes(message))){
      log.message(message)
    }
    if($files.length > 0){
      CurrentStep = Step.TOPICS
      if(selectedOutputPath){
        CurrentStep = Step.READY
      }
    }
  }
</script>

<div class="std-flex">
    <input bind:value={APIKey} disabled={CurrentStep.valueOf() >= 1?true:false} type="password" placeholder="ElevenLabs API Key" class="input input-sm input-bordered w-fit flex-grow std-shadow"/>
    <button on:click={apply} disabled={!APIKey} class="btn btn-sm btn-accent w-1/6 font-bold font-sans active:font-sans std-shadow">{CurrentStep.valueOf() >= 1?'Reset':'Apply'}</button>
  </div>
  <div class="std-flex">
    <select bind:value={selectedVoiceName} on:change={changeSelectedVoiceName} disabled={CurrentStep.valueOf() >= 1?false:true} class="select select-sm select-bordered w-fit flex-grow font-normal std-shadow">
      {#each $voices as voice}
        <option>{voice.voice_name} ({voice.voice_category})</option>
      {/each}
    </select>
    <button on:click={()=>new Audio($selectedVoice.voice_preview).play()} disabled={CurrentStep.valueOf() >= 2?false:true} class="btn btn-sm btn-accent w-1/6 font-bold font-sans active:font-sans std-shadow">Preview</button>
  </div>
  <div class="std-flex pt-2">
    <div class="tooltip w-full" data-tip="{"Stability: "+stability}">
      <input bind:value={stability} disabled={CurrentStep.valueOf() >= 2?false:true} type="range" min="0" max="100" class="range range-accent range-xs" /> 
    </div>
    <div class="tooltip w-full" data-tip="{"Clarity: "+clarity}">
      <input bind:value={clarity} disabled={CurrentStep.valueOf() >= 2?false:true}  type="range" min="0" max="100" class="range range-accent range-xs" /> 
    </div>
  </div>
<div class="std-flex">
  <select bind:value={selectedModelName} on:change={changeSelectedModelName} disabled={CurrentStep.valueOf() >= 1 ? false : true} class="select select-sm select-bordered w-fit flex-grow font-normal std-shadow">
    {#each elevenModels as model, index}
      <option value={model.name} selected={index === 0}>{model.name}</option>
    {/each}
  </select>
</div>
  <div class="card rounded-lg bg-base-200 h-[64.8vh] mx-2 std-shadow py-2 overflow-auto">
    {#each [...logs].reverse() as Message, index}
    <div class="badge badge-lg w-[98%] self-center text-white center text-ellipsis rounded-none justify-start {index==logs.length-1?'rounded-b-lg':''} {index==0?'rounded-t-lg':''} {index%2==0?'':'bg-base-300'}">{Message}</div>
    {/each}
  </div>
  <div class="std-flex justify-between">
    <div class="{$files.length>0?'tooltip':''}" data-tip="{"Selected "+$files.length+" topic files"}">
      <button on:click={selectElevenTopicFiles} disabled={CurrentStep.valueOf() >= 2?false:true} class="btn btn-xs btn-accent w-auto font-bold font-sans active:font-sans std-shadow max-w-xs">Select Topic Files</button>
    </div>
    <div class=" {$files.length>0?'':'hidden'} tooltip" data-tip="Clear selected files">
      <button on:click={clearTopicFiles} class="btn btn-xs btn-error w-auto font-bold font-sans active:font-sans std-shadow"><iconify-icon icon="ci:trash-full" style="color: --primary;" width="20" height="20"></iconify-icon></button>
    </div>
    <label class="cursor-pointer label ml-auto -mt-[5px]">
      <span class="label-text pr-2">Generate LIP</span>
      <input disabled={CurrentStep.valueOf() >= 3?false:true} bind:checked={saveLipFiles} type="checkbox" class="checkbox checkbox-xs checkbox-success" />
    </label>
    <button on:click={changeFonixDataPath} disabled={CurrentStep.valueOf() >= 3?false:true} class="{saveLipFiles?'':'hidden'} btn btn-xs btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select FonixData.cdf</button>
    <button on:click={changeOutputPath} disabled={CurrentStep.valueOf() >= 3?false:true} class="btn btn-xs btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select output folder</button>
    <button on:click={toggleGeneration} disabled={CurrentStep.valueOf() >= 4?false:true} class="btn btn-xs btn-accent w-auto font-bold font-sans active:font-sans std-shadow">{(CurrentStep == Step.GENERATING?'Stop Generating':'Start Generating')}</button>
</div>