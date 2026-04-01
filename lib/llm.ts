import OpenAI from 'openai'

export function getLLMClient() {
  const useNvidia = process.env.USE_NVIDIA === 'true'
  return new OpenAI({
    baseURL: useNvidia
      ? 'https://integrate.api.nvidia.com/v1'
      : 'https://openrouter.ai/api/v1',
    apiKey: useNvidia
      ? process.env.NVIDIA_API_KEY!
      : process.env.OPENROUTER_API_KEY!,
  })
}

export function getModel() {
  const useNvidia = process.env.USE_NVIDIA === 'true'
  return useNvidia
    ? 'meta/llama-3.3-70b-instruct'
    : 'meta-llama/llama-3.3-70b-instruct'
}
