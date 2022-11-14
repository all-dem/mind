import inquirer from 'inquirer'
import * as fs from 'fs-extra'
import { isApiKeyValid } from './openai'
import { getCompletionFromOpenAI } from './openai-bash-help'
import { buildQuestion } from './openai-completion-builder'
import * as marked from 'marked'
import TerminalRenderer from 'marked-terminal'

// Set marked to use TerminalRenderer
const textRenderer = new TerminalRenderer()

;(marked as any).setOptions({
  renderer: textRenderer,
})

interface Config {
  openAIKey?: string
  tokensUsed?: number
}

export interface JSONObject {
  [key: string | number]: JSONType
}

export type JSONArray = Array<JSONType>

export type JSONPrimitive = string | number | boolean | null
export type JSONType = JSONObject | JSONArray | JSONPrimitive

/**
 * Function to load configuration file from ~/.thinkforme.json If the Open AI
 * Key is not in an environment variable or the configuration file prompt for
 * it and open a browser to where they can get their key
 * @param path {string} The path to the json file
 * @returns {Promise<JSONType>} The json file
 * @param defaultContents {JSONType} The default contents of the json file if it
 * does not exist
 */
async function readJsonFile(
  path: string,
  defaultContents?: JSONObject
): Promise<JSONObject> {
  try {
    console.log(path)
    const exists = await fs.pathExists(path)
    return exists
      ? JSON.parse(await fs.readFile(path, 'utf8'))
      : defaultContents || {}
  } catch (err) {
    return defaultContents || {}
  }
}
async function updateJsonFile(
  path: string,
  updateObject: JSONObject
): Promise<boolean> {
  const result = await fs.writeFile(path, JSON.stringify(updateObject, null, 2))

  return result !== undefined ? true : false
}
/**
 * Load the configuration file from ~/.thinkforme.json
 * If the configuration does not exist or the openAIKey is not defined then
 * the user is prompted through inquirer to enter an openAIKey.
 * @return {Config} The configuration object
 */
async function loadConfig(): Promise<Config> {
  const userRoot = process.env['HOME'] || process.env['USERPROFILE']
  const configPath = `${userRoot}/.thinkforme.json`
  const config: Partial<Config> = await readJsonFile(configPath, {
    tokensUsed: 0,
  })

  config['openAIKey'] =
    config['openAIKey'] ||
    process.env['OPENAI_KEY'] ||
    (
      await inquirer.prompt({
        type: 'input',
        name: 'openAIKey',
        message:
          'Please enter your OpenAI API Key. \nGrab one here https://beta.openai.com/account/api-keys',
      })
    ).openAIKey

  while (!(await isApiKeyValid(config['openAIKey'] as string))) {
    config['openAIKey'] = (
      await inquirer.prompt({
        type: 'input',
        name: 'openAIKey',
        message:
          'Please enter your OpenAI API Key. \nGrab one here https://beta.openai.com/account/api-keys',
      })
    ).openAIKey
  }

  updateJsonFile(configPath, config)
  return config
}
/**
 * This is the entrypoint to the command line.
 * @return {void}
 */
async function main(): Promise<void> {
  const config = await loadConfig()

  console.log("  Alice: Hello I'm Alice, how can I help today?")

  do {
    // use inquirer to let the user enter their reply
    const userReply = (
      await inquirer.prompt({
        type: 'input',
        name: 'userReply',
        message: 'Human:',
      })
    ).userReply
    if (userReply === 'bye' || userReply === 'exit') {
      break
    }
    // Create the banner for alice
    // all of the parameters to the thinkforme commands are a sentence.
    const openAIKey: string = config?.openAIKey || ''

    const builtQuestion = await buildQuestion(userReply)
    const completion = await getCompletionFromOpenAI(openAIKey, builtQuestion)

    const markdownParsedCompletion = (marked.marked as any)(completion)
    console.log(markdownParsedCompletion)
  } while (1)
}
main()
