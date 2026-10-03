// Copies the static build into the Express app so `npm start` in code/ serves it at "/"
import { cpSync, rmSync } from 'node:fs'
const dest = new URL('../../code/site/', import.meta.url)
rmSync(dest, { recursive: true, force: true })
cpSync(new URL('../out/', import.meta.url), dest, { recursive: true })
console.log('Landing copied to code/site')
