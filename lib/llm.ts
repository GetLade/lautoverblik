import OpenAI from 'openai'

export function getLLMClient() {
  const useNvidia = process.env.USE_NVIDIA?.toLowerCase() === 'true'
  return new OpenAI({
    baseURL: useNvidia
      ? 'https://integrate.api.nvidia.com/v1'
      : 'https://api.groq.com/openai/v1',
    apiKey: useNvidia
      ? process.env.NVIDIA_API_KEY!
      : process.env.GROQ_API_KEY!,
  })
}

export function getModel() {
  const useNvidia = process.env.USE_NVIDIA?.toLowerCase() === 'true'
  return useNvidia
    ? 'meta/llama-3.3-70b-instruct'
    : 'llama-3.3-70b-versatile'
}
