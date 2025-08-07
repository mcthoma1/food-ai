import { DetectionResult } from '@/types/DetectionResult';

const API_URL = 'https://api.clarifai.com/v2/models/food-item-recognition/outputs';
const API_KEY = process.env.CLARIFAI_API_KEY;

export async function detectFoodsWithClarifai(base64: string): Promise<DetectionResult[]> {
  const payload = {
    user_app_id: {
      user_id: "mcthoma1",
      app_id: "food-ai"
    },
    inputs: [
      {
        data: {
          image: { base64 }
        }
      }
    ]
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Clarifai API error: ${response.statusText}`);
  }

  const data = await response.json();

  const concepts = data.outputs?.[0]?.data?.concepts || [];

  return concepts.map((concept: any) => ({
    name: concept.name,
    value: concept.value,
  }));
}
