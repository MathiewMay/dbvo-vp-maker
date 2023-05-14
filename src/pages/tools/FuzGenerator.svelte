<script lang="ts">
  import { MessageBoard } from "../../lib/MessageBoard";
  import { readDir, exists } from '@tauri-apps/api/fs';
  import { open } from '@tauri-apps/api/dialog';
  import { executeBmlFuzEncodeCommand } from "../../lib/BmlFuzEncodeAPI";

  const log = new MessageBoard(["Select the folder that contains your wav files"])
  let logs: string[]
  log.messages.subscribe((messages) => {
    logs = messages
  })

  enum Step { IDLE, INPUT, LIP, READY, GENERATING }
  let CurrentStep: Step = Step.IDLE

  let selectedInputWavPath: string
  let selectedInputLipPath: string
  let selectedOutputFuzPath: string

  async function changeInputWavPath() {
    const selectedFolder = await open({
          directory: true,
          multiple: false,
    })
    selectedInputWavPath = selectedFolder.toString()
    log.message("Changed wav folder path to "+selectedInputWavPath)
  }

  async function changeInputLipPath() {
    const selectedFolder = await open({
          directory: true,
          multiple: false,
    })
    selectedInputLipPath = selectedFolder.toString()
    log.message("Changed lip folder path to "+selectedInputLipPath)
  }

  async function changeOutputFuzPath() {
    const selectedFolder = await open({
          directory: true,
          multiple: false,
    })
    selectedOutputFuzPath = selectedFolder.toString()
    log.message("Changed fuz folder path to "+selectedOutputFuzPath)
  }

  async function doEverything() {
    await readDir(selectedInputWavPath).then(async files => {
      files.forEach(async file=>{
        if(!file.children && file.name.endsWith('.wav') && exists(selectedInputLipPath+'\\'+file.name.replace('.wav','.lip'))){
          const wavFile = file.path
          const lipFile = selectedInputLipPath+'\\'+file.name.replace('.wav','.lip')
          const fuzFile = selectedOutputFuzPath+'\\'+file.name.replace('.wav','.fuz')
          log.message(file.name)
        }
      })
    })
  }
</script>

<div class="flex flex-row gap-2 flex-grow justify-between px-2">
  <button on:click={changeInputWavPath} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select folder containing wav files</button>
  <button on:click={changeInputLipPath} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select folder containing lip files</button>
</div>
<div class="card rounded-lg bg-base-200 h-[81.8vh] mx-2 std-shadow py-2 overflow-auto">
  {#each [...logs].reverse() as Message, index}
    <div class="badge badge-lg w-[98%] self-center text-white center rounded-none justify-start {index==logs.length-1?'rounded-b-lg':''} {index==0?'rounded-t-lg':''} {index%2==0?'':'bg-base-300'}">{Message}</div>
  {/each}
</div>
<div class="flex flex-row gap-2 flex-grow justify-between px-2">
  <button on:click={changeOutputFuzPath} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select output folder</button>
  <button on:click={doEverything} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Start fuz generation</button>
</div>