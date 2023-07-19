<script lang="ts">
  import { MessageBoard } from "../../lib/MessageBoard";
  import { open } from '@tauri-apps/api/dialog';
  import { readDir, copyFile, createDir, exists, readTextFile } from '@tauri-apps/api/fs'; // Updated import statements
  import { executeFaceFXWrapperCommand } from "../../lib/FaceFXWrapperAPI";

  const log = new MessageBoard(["Select the folder containing your wav files"]);
  let logs: string[];
  log.messages.subscribe((messages) => {
    logs = messages;
  });

  enum Step { IDLE, INPUT, FONIX, READY, GENERATING }
  let CurrentStep: Step = Step.IDLE;

  let selectedInputWavPath: string;
  let selectedOutputLipPath: string;
  let selectedFonixDataPath: string;
  let concurrentJobs: number = 50;
  let percentTodo: number;
  let percentDid: number = 0;
  let percent: number = 0;

  async function changeInputPath() {
    const selectedFolder = await open({
      directory: true,
      multiple: false,
    });
    selectedInputWavPath = selectedFolder.toString();
    log.message("Wav path set to \"" + selectedInputWavPath + "\"");
    CurrentStep = Step.INPUT;
    if (selectedOutputLipPath) CurrentStep = Step.READY;
    if (selectedFonixDataPath) CurrentStep = Step.FONIX;
  }

  async function changeFonixDataPath() {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Topic File',
        extensions: ['txt']
      }]
    });
    selectedFonixDataPath = selected as string;
    log.message("Fonix set to \"" + selectedFonixDataPath + "\"");
    CurrentStep = Step.FONIX;
    if (selectedOutputLipPath) CurrentStep = Step.READY;
  }

  async function changeOutputPath() {
    const selectedFolder = await open({
      directory: true,
      multiple: false,
    });
    selectedOutputLipPath = selectedFolder.toString();
    log.message("Output path set to \"" + selectedOutputLipPath + "\"");
    CurrentStep = Step.READY;
  }

  async function toggleLip() {
    if (CurrentStep !== Step.READY) {
      log.message("Please select the required folders and files.");
      return;
    }

    CurrentStep = Step.GENERATING;
    log.message("Reading directory...");
    const files = await readDir(selectedInputWavPath);
    const wavFiles: string[] = [];
    files.forEach(file => {
      if (file.name.endsWith(".wav") && !file.children) {
        wavFiles.push(file.name);
      }
    });

    const txtContent = await readTextFile(selectedFonixDataPath);
    const lines = txtContent.split("\n");

    percentTodo = lines.length;
    for (const line of lines) {
      const wavFilename = parseForSpecialCharacters(parseForParentheses(line.trim())) + ".wav";
      if (wavFiles.includes(wavFilename)) {
        const sourcePath = selectedInputWavPath + "/" + wavFilename;
        const destinationPath = selectedOutputLipPath + "/" + wavFilename;
        try {
          await copyFile(sourcePath, destinationPath);
          log.message("Copied \"" + wavFilename + "\" to output folder");
        } catch (error) {
          console.error("Error copying \"" + wavFilename + "\":", error);
        }
      }
      percentDid++;
      incrementPercent();
    }

    log.message("WAV file copying complete.");
    CurrentStep = Step.READY;
  }

  function parseForSpecialCharacters(input: string): string {
    const regex = /[\s\\/:*?"<>|]/g;
    input = input.replace(regex, '_');
    return input;
  }

  function parseForParentheses(input: string): string {
    return input.split(' (')[0];
  }

  function incrementPercent() {
    percent = Math.round((percentDid / percentTodo) * 100);
  }

  $: percent;

</script>

<div class="flex flex-row gap-2 flex-grow justify-between px-2">
  <button on:click={changeInputPath} disabled={CurrentStep >= Step.INPUT} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select folder containing wav files</button>
  <button on:click={changeFonixDataPath} disabled={CurrentStep !== Step.INPUT} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select a topic.txt file</button>
</div>
<div class="card rounded-lg bg-base-200 h-[81.6vh] mx-2 std-shadow py-2 overflow-auto">
  {#each [...logs].reverse() as Message, index}
  <div class="badge badge-lg w-[98%] self-center text-white center text-ellipsis rounded-none justify-start {index==logs.length-1?'rounded-b-lg':''} {index==0?'rounded-t-lg':''} {index%2==0?'':'bg-base-300'}">{Message}</div>
  {/each}
</div>
<div class="flex flex-row gap-2 flex-grow justify-between px-2">
  <button on:click={changeOutputPath} disabled={CurrentStep !== Step.FONIX} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Select output folder</button>
  <button on:click={toggleLip} disabled={CurrentStep !== Step.READY} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Start WAV patcher</button>
</div>
