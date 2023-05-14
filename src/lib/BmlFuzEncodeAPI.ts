import { Command } from '@tauri-apps/api/shell'

export async function executeBmlFuzEncodeCommand() {
  const command = new Command('yakitori-audio-converter')
  return await command.execute()
}