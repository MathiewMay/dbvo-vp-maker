import { Command } from '@tauri-apps/api/shell'

export async function executeFFmpegCommand(input: string, output: string, gain: number = 0) {
  const args = [
    "-i",
    input,
    "-af",
    "volume="+(gain/50+1),
    "-ac",
    "1",
    "-ar",
    "42000",
    "-acodec",
    "pcm_s16le",
    output
  ];  
  const command = Command.sidecar('./bin/ffmpeg', args)
  return await command.execute()
}