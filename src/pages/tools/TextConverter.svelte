<script lang="ts">
  let inputText: string = ""
  let outputText: string = ""

  async function glazingGerald(){
    let inputs: string[] = inputText.split("\n")
    let outputs: string[] = []
    await inputs.forEach(input => {
      outputs.push(parseForSpecialCharacters(parseForParentheses(input.trim())))
    })
    outputText = outputs.join("\n")
    console.log(outputs.join("\n"))
  }

  function parseForSpecialCharacters(input: string): string {
    const regex = /[\s\\/:*?"<>|]/g
    input = input.replace(regex, '_');
    return input;
  }

  function parseForParentheses(input: string): string {
    return input.split(' (')[0];
  }

  $: inputText, outputText;
</script>

<div class="card px-4 gap-10">
  <p>Input:</p>
  <textarea bind:value={inputText} class="textarea textarea-accent h-60" placeholder="Input Text"></textarea>
  <p>Output:</p>
  <textarea bind:value={outputText} class="textarea textarea-accent h-60" placeholder="Output Text"></textarea>
  <button on:click={glazingGerald} class="btn btn-accent w-auto font-bold font-sans active:font-sans std-shadow">Convert</button>
</div>