import { Command } from '@tauri-apps/api/shell'

export async function executeFaceFXWrapperCommand(fonixDataPath: string, wavPath: string, resampledWavPath: string, lipPath: string, text: string) {
  const command = Command.sidecar('./bin/FaceFXWrapper', ["Skyrim", "USEnglish", fonixDataPath, wavPath, resampledWavPath, lipPath, text])
  return await command.execute()
}
