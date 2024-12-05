import OpenAI from 'openai';

// Create an OpenAI API client (that's edge friendly!)
export function createOpenAI() {
  try {
    return new OpenAI({
      apiKey:
        process.env.OPENAI_API_KEY ||
        (() => {
          throw new Error('Missing OpenAI API key');
        })(),
    });
  } catch (error) {
    console.error('Error creating OpenAI client:', error);
    throw error;
  }
}

export async function generateEmbedding(_input: string) {
  const openai = createOpenAI();
  const input = _input.replace(/\n/g, ' ');
  const embeddingData = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input,
  });
  //   console.log(embeddingData);
  const [{ embedding }] = (embeddingData as any).data;
  return embedding;
}
