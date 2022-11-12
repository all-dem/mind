import { Configuration, OpenAIApi } from 'openai'

export async function isApiKeyValid(openAIKey: string): Promise<boolean> {
  const configuration = new Configuration({
    apiKey: openAIKey,
  })
  const openai = new OpenAIApi(configuration)
  try {
    await openai.listModels()
    return true
  } catch (err) {
    return false
  }
}
