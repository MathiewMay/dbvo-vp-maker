<script lang="ts">
  let localeText: string = "";
  let englishText: string = "";
  let outputText: string = "";

  async function glazingGerald() {
    let localeInputs: string[] = localeText.split("\n");
    let englishInputs: string[] = englishText.split("\n");
    let outputs: { [key: string]: string } = {};
    await localeInputs.forEach((input, index) => {
      const parsedLocale = parseForSpecialCharacters(parseForParentheses(input.trim()));
      const parsedEnglish = parseForSpecialCharacters(englishInputs[index].trim());
      outputs[parsedLocale] = parsedEnglish;
    });
    outputText = JSON.stringify(outputs, null, 2);
    console.log(outputText);
  }

  function clear(){
    localeText = ""
    englishText = ""
    outputText = ""
  }

  function parseForSpecialCharacters(input: string): string {
    const regex = /[\s\\/:*?"<>|]/g;
    input = input.replace(regex, "_");
    return input;
  }

  function parseForParentheses(input: string): string {
    return input.split(" (")[0];
  }

  $: localeText, englishText, outputText;
</script>

<div class="card px-4 gap-4">
  <div class="flex flex-row justify-evenly gap-4">
    <div class="flex flex-col gap-4">
      <p>Locale:</p>
      <textarea bind:value={localeText} class="textarea textarea-accent h-60 w-[380px]" placeholder="Input Text"></textarea>
    </div>
    <div class="flex flex-col gap-4">
      <p>English:</p>
      <textarea bind:value={englishText} class="textarea textarea-accent h-60  w-[380px]" placeholder="Input Text"></textarea>
    </div>
  </div>
  <p>Output:</p>
  <textarea bind:value={outputText} class="textarea textarea-accent h-60" placeholder="Output Text"></textarea>
  <button on:click={clear} class="btn btn-sm btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Clear</button>
  <button on:click={glazingGerald} class="btn btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Convert</button>
</div>