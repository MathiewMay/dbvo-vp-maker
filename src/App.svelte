<script lang="ts">
  import 'iconify-icon';
  import ElevenLabsBatchTool from './pages/ElevenLabsBatchTool.svelte';
  import LipGenerator from './pages/tools/LipGenerator.svelte';
  import FuzGenerator from './pages/tools/FuzGenerator.svelte';
  import VoicePackMaker from './pages/VoicePackMaker.svelte';
  import TextConverter from './pages/tools/TextConverter.svelte';
  import LocaleMaker from './pages/tools/LocaleMaker.svelte';
  import { executeBmlFuzEncodeCommand } from './lib/BmlFuzEncodeAPI';


  enum Page { ELEVEN, LIPGEN, FUZGEN, VPMAKER, TEXTConverter, LOCALEMAKER }
  let CurrentPage: Page = Page.ELEVEN;

  function switchPage(newPage: Page) {
    CurrentPage = newPage;
  }
</script>

<div class="tabs bg-base-100 rounded-none std-shadow">
  <button class="tab tab-sm {CurrentPage == Page.ELEVEN?'tab-active text-base-400':''}" on:click={() => switchPage(Page.ELEVEN)}>ElevenLabs Batch Tool</button>
  <button class="tab tab-sm {CurrentPage == Page.VPMAKER?'tab-active  text-base-400':''}" on:click={() => switchPage(Page.VPMAKER)}>Voice Pack Maker</button>
  <div class="dropdown dropdown-hover">
    <button class="tab tab-sm {CurrentPage==Page.LIPGEN||CurrentPage==Page.FUZGEN?'tab-active text-base-400':''}">Tools</button>
    <ul class="dropdown-content menu p-2 std-shadow bg-base-300 rounded-box w-52">
      <li><button class="btn {CurrentPage == Page.LIPGEN?'bg-base-accent btn-outline hover:bg-base-100 hover:text-white':'btn-ghost'}" on:click={() => switchPage(Page.LIPGEN)}>Lip Generator</button></li>
      <li><button class="btn {CurrentPage == Page.LOCALEMAKER?'bg-base-accent btn-outline hover:bg-base-100 hover:text-white':'btn-ghost'}" on:click={() => switchPage(Page.LOCALEMAKER)}>Locale Maker</button></li>
      <li><button class="btn {CurrentPage == Page.TEXTConverter?'bg-base-accent btn-outline hover:bg-base-100 hover:text-white':'btn-ghost'}" on:click={() => switchPage(Page.TEXTConverter)}>Text Parser</button></li>
      <li><a class="btn {CurrentPage == Page.FUZGEN?'bg-base-accent btn-outline hover:bg-base-100 hover:text-white':'btn-ghost'}" href="https://www.nexusmods.com/skyrim/mods/73100" target="_blank">Yakitori Audio Converter</a></li>
    </ul>
  </div>
  <div class="dropdown dropdown-hover">
    <button class="tab tab-sm">Credits</button>
    <ul class="dropdown-content menu p-2 std-shadow bg-base-300 rounded-box w-52">
      <li><a class="btn btn-ghost" href="https://github.com/Nukem9/FaceFXWrapper" target="_blank">FaceFXWrapper</a></li>
      <li><a class="btn btn-ghost" href="https://ffmpeg.org/" target="_blank">FFmpeg</a></li>
    </ul>
  </div>
</div>

<div class="pages flex flex-col pt-4">
  <div class="eleven flex flex-col gap-4 {CurrentPage == Page.ELEVEN?'':'hidden'}">
    <ElevenLabsBatchTool/>
  </div>
  <div class="lipgen flex flex-col gap-4 {CurrentPage == Page.LIPGEN?'':'hidden'}">
    <LipGenerator/>
  </div>
  <!--
  <div class="fuzgen flex flex-col gap-4 {CurrentPage == Page.FUZGEN?'':'hidden'}">
    <FuzGenerator/>
  </div>
    -->
  <div class="vpmaker flex flex-col gap-4 {CurrentPage == Page.VPMAKER?'':'hidden'}">
    <VoicePackMaker/>
  </div>

  <div class="textconverter flex flex-col gap-4 {CurrentPage == Page.TEXTConverter?'':'hidden'}">
    <TextConverter/>
  </div>

  <div class="localemaker flex flex-col gap-4 {CurrentPage == Page.LOCALEMAKER?'':'hidden'}">
    <LocaleMaker/>
  </div>
</div>