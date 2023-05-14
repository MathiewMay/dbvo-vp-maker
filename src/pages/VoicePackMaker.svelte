<script lang="ts">
  import { readDir, createDir, writeFile, copyFile } from '@tauri-apps/api/fs';
  import { open } from '@tauri-apps/api/dialog';
  import { MessageBoard } from '../lib/MessageBoard';

  const log = new MessageBoard([])
  let logs: string[]
  log.messages.subscribe((messages) => {
    logs = messages
  })

  let displayName: string
  let voicepackID: string
  let selectedInputPath: string
  let selectedOutputPath: string

  async function changeInputPath() {
    const selectedFolder = await open({
          directory: true,
          multiple: false,
    })
    selectedInputPath = selectedFolder.toString()
    log.message("Changed input folder path to "+selectedInputPath)
  }

  async function changeOutpathPath() {
    const selectedFolder = await open({
          directory: true,
          multiple: false,
    })
    selectedOutputPath = selectedFolder.toString()
    log.message("Changed output folder path to "+selectedOutputPath)
  }

  async function clickly(){
    if(displayName && voicepackID && selectedInputPath && selectedOutputPath){
      let vpJson = { "voice_pack_name": displayName, "voice_pack_id": voicepackID }
      await createDir(selectedOutputPath+"\\DragonbornVoiceOver\\voice_packs\\", {recursive:true})
      await createDir(selectedOutputPath+"\\Sound\\DBVO\\"+voicepackID+"\\", {recursive:true})
      await writeFile(selectedOutputPath+"\\DragonbornVoiceOver\\voice_packs\\"+voicepackID.toLowerCase()+"_voice_pack.json",JSON.stringify(vpJson))
      log.message("Processing... this could take up to 5 minutes")
      await readDir(selectedInputPath).then(async files=>{
        files.forEach(async file => {
          if(file.name.endsWith(".fuz")){
            await copyFile(file.path, selectedOutputPath+"\\Sound\\DBVO\\"+voicepackID+"\\"+file.name)
          }
        })
      })
      log.message("Done!")
    }else{
      log.message("Please fill up and select all the fields.")
    }
  }
</script>

<div class="flex flex-col gap-4 p-2">
  <span class="label-text">Display name: The name that will show up in the MCM menu</span>
  <input bind:value={displayName} type="text" placeholder="Display name" class="input input-sm input-bordered w-full" />
  <span class="label-text">Unique ID: A unique ID for your voice pack. It's recommended to include your username in the ID</span>
  <input bind:value={voicepackID} type="text" placeholder="Unique ID" class="input input-sm input-bordered w-full" />
  <div class="card rounded-lg bg-base-200 h-[53vh] std-shadow py-2 overflow-auto">
    {#each [...logs].reverse() as Message, index}
      <div class="badge badge-lg w-[98%] self-center text-white center text-ellipsis overflow-hidden rounded-none justify-start {index==logs.length-1?'rounded-b-lg':''} {index==0?'rounded-t-lg':''} {index%2==0?'':'bg-base-300'}">{Message}</div>
    {/each}
  </div>
  <button on:click={changeInputPath} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select folder containing fuz files</button>
  <button on:click={changeOutpathPath} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select output folder (this will contain the voice pack ready to ship)</button>
  <button on:click={clickly} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Create Voice Pack</button>
</div>
