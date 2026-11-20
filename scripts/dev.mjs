import { spawn } from 'node:child_process'

const isWindows = process.platform === 'win32'
const command = isWindows ? 'cmd.exe' : 'npx'

const launch = (args) =>
  spawn(command, isWindows ? ['/c', 'npx', ...args] : args, {
    stdio: 'inherit',
  })

const server = launch(['tsx', 'watch', 'src/server/index.ts'])
const client = launch(['vite'])

let shuttingDown = false
const shutdown = (code = 0) => {
  if (shuttingDown) return
  shuttingDown = true
  try {
    server.kill('SIGTERM')
  } catch {}
  try {
    client.kill('SIGTERM')
  } catch {}
  process.exit(code)
}

server.on('exit', (code) => {
  if (!shuttingDown) shutdown(code ?? 0)
})

client.on('exit', (code) => {
  if (!shuttingDown) shutdown(code ?? 0)
})

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
