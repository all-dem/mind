import * as os from 'os'
import fs from 'fs-extra'
import pupa from 'pupa'
import fg from 'fast-glob'
import path from 'path'

const platform = os.platform()

export async function buildQuestion(question: string): Promise<string> {
  // starting with ./templates/introduction.pupa
  // Then choosing 5 random pupa files from the examples folder
  // Then appending the humans question.

  const pupaTemplateParameters = {
    user: process.env['USER'] || 'unknown',
    homePath: os.homedir(),
    cwd: process.cwd(),
    platform: platform,
    shell: process.env['SHELL'] || 'unknown',
    question: question,
    terminal: process.env['TERM'] || 'unknown',
  }

  const introduction = loadTemplate(
    path.join(__dirname, './templates/command-line/introduction.pupa'),
    pupaTemplateParameters
  )
  const examples = await getRandomExamples(
    path.join(__dirname, './templates/command-line/examples'),
    5,
    pupaTemplateParameters
  )
  const humanQuestion = `Human: ${question}\n\nAI:\n`

  return [introduction, examples, humanQuestion].join('\n\n')
}
export async function getRandomExamples(
  path: string,
  count: number,
  pupaTemplateParameters: any
): Promise<string> {
  const files = await fg(`${path}/**/*.pupa`)
  const randomFiles = getRandom(files, count)
  const examples = randomFiles.map((file) =>
    loadTemplate(file, pupaTemplateParameters)
  )
  return (await Promise.all(examples)).join('\n')
}

function getRandom<T>(items: T[], count: number): T[] {
  const shuffled = items.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export async function loadTemplate(
  path: string,
  parameters: Record<string, string>
): Promise<string> {
  const template = await fs.readFile(path, 'utf8')
  return pupa(template, parameters)
}
