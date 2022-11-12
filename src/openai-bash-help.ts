import { Configuration, OpenAIApi } from 'openai'
import Ajv from 'ajv'
import fastLevenshtein from 'fast-levenshtein'
const ajv = new Ajv()

export async function getCompletionFromOpenAI(
  apiKey: string,
  question: string
): Promise<string> {
  const configuration = new Configuration({
    apiKey,
  })
  const openai = new OpenAIApi(configuration)

  const response: any = await openai.createCompletion({
    model: 'code-davinci-002',
    prompt: question,
    temperature: 0,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ['Human:'],
  })

  const completedCharacters = response.data.choices[0].text

  const jsonReply = completedCharacters
  return jsonReply
  // try {
  //   const parsedJson = JSON.parse(jsonReply)

  //   const validationErrors = deeplyValidateAIJSONRespose(parsedJson)
  //   if (validationErrors.length > 0) {
  //     errors.push(...validationErrors)
  //   } else {
  //     return parsedJson
  //   }
  // } catch (err: any) {
  //   console.log(completedCharacters)
  //   errors.push(err.message)
  // }

  // }
  // console.log(errors)
  // return errors
}

const aiResponseJsonSchema = {
  type: 'object',
  properties: {
    command: { type: 'string' },
    explanation: { type: 'string' },
    installSteps: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['command', 'explanation'],
}
interface Config {
  command: string
  explanation: string
  installSteps: string[]
}

/**
 * This function will validate the json response from openai
 * It checks for structure and edge cases...
 * @param {any} aiResponse
 */
export function deeplyValidateAIJSONRespose(aiResponse: Config): string[] {
  const errors: string[] = []
  const validate = ajv.compile(aiResponseJsonSchema)
  const valid = validate(aiResponse)
  if (!valid) {
    errors.push('Failed schema validation')
    // ...(validate?.errors
    //   ?.map((e) => e.message)
    //   ?.filter((a) => a !== undefined) || [])
  }
  if (!valid) {
    errors.push('validator failed')
  }

  if (aiResponse.explanation.length < 10) {
    errors.push('explanation is too short')
  }
  if (aiResponse.command.length < 3) {
    errors.push('command is too short')
  }
  if (fastLevenshtein.get(aiResponse.command, aiResponse.explanation) < 3) {
    errors.push(`description is too similar to explanation.`)
  }
  // validate the schema with
  return errors
}
