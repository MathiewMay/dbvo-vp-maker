<script lang="ts">
  import { MessageBoard } from "../../lib/MessageBoard";
  import { open } from '@tauri-apps/api/dialog';
  import { readDir, removeDir, createDir, exists, type FileEntry } from '@tauri-apps/api/fs';
  import { executeFaceFXWrapperCommand } from "../../lib/FaceFXWrapperAPI";

  const log = new MessageBoard(["Select the folder containing your wav files"])
  let logs: string[]
  log.messages.subscribe((messages) => {
    logs = messages
  })

  enum Step { IDLE, INPUT, FONIX, READY, GENERATING }
  let CurrentStep: Step = Step.IDLE

  let selectedInputWavPath: string
  let selectedOutputLipPath: string
  let selectedFonixDataPath: string
  let concurrentJobs: number = 50
  let percentTodo: number
  let percentDid: number = 0
  let percent: number = 0

  async function changeInputPath() {
    const selectedFolder = await open({
          directory: true,
          multiple: false,
    })
    selectedInputWavPath = selectedFolder.toString()
    log.message("Wav path set to \""+selectedInputWavPath+"\"")
    CurrentStep = Step.INPUT
    if(selectedFonixDataPath)
      CurrentStep = Step.FONIX
    if(selectedOutputLipPath)
      CurrentStep = Step.READY
  }

  async function changeFonixDataPath() {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'FonixData',
        extensions: ['cdf']
      }]
    })
    selectedFonixDataPath = selected as string
    log.message("Fonix set to \""+selectedFonixDataPath+"\"")
    CurrentStep = Step.FONIX
    if(selectedOutputLipPath)
      CurrentStep = Step.READY
  }
  
  async function changeOutputPath() {
    const selectedFolder = await open({
          directory: true,
          multiple: false,
    })
    selectedOutputLipPath = selectedFolder.toString()
    log.message("Output path set to \""+selectedOutputLipPath+"\"")
    CurrentStep = Step.READY
  }

  /*async function toggleLip() {
    const files = await readDir(selectedInputWavPath)
    let wavFiles: FileEntry[]
    files.forEach(file => {
      if(file.name.endsWith(".wav") && !file.children)
        wavFiles.push(file)
    })

    const tempPath = selectedOutputLipPath+"\\temp\\"
    await createDir(tempPath)
    wavFiles.forEach(async file => {
      //With the await bellow
      await executeFaceFXWrapperCommand(selectedFonixDataPath, file.path, tempPath+file.name, selectedOutputLipPath+"\\"+file.name.replace('.wav','.lip'), file.name.replace('.wav','').replaceAll('_','')).then(()=>{
        //Comment
      })
    })
  }*/

  function incrementPercent() {
    console.log(percentDid+" and "+percentTodo)
    percent = Math.round(( percentDid / percentTodo) * 100)
  }

  $: percent;

  async function toggleLip() {
    CurrentStep = Step.GENERATING;
    log.message("Reading directory...");
    const files = await readDir(selectedInputWavPath);
    const wavFiles = [];
    files.forEach(file => {
      if (file.name.endsWith(".wav") && !file.children) {
        wavFiles.push(file);
      }
    });

    const tempPath = selectedOutputLipPath + "\\temp\\";
    await createDir(tempPath);
    const promises = [];

    percentTodo = wavFiles.length
    for (const file of wavFiles) {
      const outputPath = selectedOutputLipPath + "\\" + file.name.replace('.wav', '.lip');
      const filename = file.name.replace('.wav', '').replaceAll('_', '');
      const cmdPromise = executeFaceFXWrapperCommand(selectedFonixDataPath, file.path, tempPath + file.name, outputPath, filename);

      promises.push(cmdPromise);

      if (promises.length >= concurrentJobs) {
        try {
          log.message("Processing \""+file.name+"\"...")
          await Promise.race(promises);
          percentDid++
          incrementPercent()
        } catch (error) {
          log.message("Could not process \""+file.name+"\", timed out.")
          percentDid++
          incrementPercent()
          console.error(error);
        }
        promises.splice(0, 1);
      }
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error(error);
    }

    log.message("Lip generation complete.");
    CurrentStep = Step.READY
  }
</script>

<div class="flex flex-row gap-2 flex-grow justify-between px-2">
  <button on:click={changeInputPath} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select folder containing wav files</button>
  <button on:click={changeFonixDataPath} disabled={CurrentStep.valueOf() >= 1 && CurrentStep.valueOf() < 4? false:true} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select FonixData.cdf</button>
</div>
<div class="flex flex-row gap-2 flex-grow justify-between px-2">
  <div class="tooltip w-full" data-tip="{"Concurrent: "+concurrentJobs+" (higher takes more memory)"}">
    <input bind:value={concurrentJobs} disabled={CurrentStep.valueOf() >= 2?false:true} type="range" min="1" max="200" class="range range-accent range-xs" /> 
  </div>
</div>
<div class="card rounded-lg bg-base-200 h-[76.8vh] mx-2 std-shadow py-2 overflow-auto">
  {#each [...logs].reverse() as Message, index}
    <div class="badge badge-lg w-[98%] self-center text-white center text-ellipsis rounded-none justify-start {index==logs.length-1?'rounded-b-lg':''} {index==0?'rounded-t-lg':''} {index%2==0?'':'bg-base-300'}">{Message}</div>
  {/each}
</div>
<div class="flex flex-row gap-2 flex-grow justify-between px-2">
  <button on:click={changeOutputPath} disabled={CurrentStep.valueOf() >= 2?false:true} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select output folder</button>
  <div class="form-control {CurrentStep == Step.GENERATING?'':'hidden'} w-full gap-2 -my-1 max-w-xs ml-auto">
    <span class="label-text"><iconify-icon icon="eos-icons:bubble-loading" style="color: gold;"></iconify-icon> Processing {percent}%</span>
    <progress class="progress progress-warning bg-white w-56" value="{percent}" max="100"></progress>
  </div>
  <button on:click={toggleLip} disabled={CurrentStep.valueOf() == 3?false:true} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Start lip generation</button>
</div>