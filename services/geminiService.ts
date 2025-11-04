
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedImage, AspectRatio } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageModel = 'imagen-4.0-generate-001';
const textModel = 'gemini-2.5-flash';

const metadataSchema = {
  type: Type.OBJECT,
  properties: {
    alt: {
      type: Type.STRING,
      description: 'A concise, descriptive alternative text for the image, crucial for accessibility.'
    },
    title: {
      type: Type.STRING,
      description: 'A short, catchy, and SEO-friendly title for the image.'
    },
    caption: {
      type: Type.STRING,
      description: 'An engaging, single-sentence caption to display under the image.'
    },
    description: {
      type: Type.STRING,
      description: 'A short paragraph (2-3 sentences) providing more context or detail about the image.'
    },
  },
  required: ['alt', 'title', 'caption', 'description'],
};

interface ImageTask {
  prompt: string;
  aspectRatio: AspectRatio;
  id: string;
}

export const generateImageAndMetadata = async (task: ImageTask): Promise<GeneratedImage> => {
  const { prompt, aspectRatio, id } = task;

  const imageGenerationPrompt = `Subject: ${prompt}. Style: Ultra-realistic photorealism, mimicking a shot from a high-end DSLR camera with a 50mm f/1.8 lens. The image must look like a genuine photograph from a professional food blog or a prestigious cooking magazine. Lighting: Natural, soft window light creating gentle, realistic shadows that emphasize texture and depth. Composition: Artfully arranged but not overly staged, with a shallow depth of field to draw focus. Details: Extremely high detail, sharp focus on the main subject, appetizing, vibrant, and natural colors. Avoid any tell-tale signs of AI generation; it must be indistinguishable from a real photo.`;

  // Generate Image and Metadata concurrently
  const [imageResponse, metadataResponse] = await Promise.all([
    ai.models.generateImages({
      model: imageModel,
      prompt: imageGenerationPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio,
      },
    }),
    ai.models.generateContent({
      model: textModel,
      contents: `For a food blog image related to the theme "${prompt}", generate appropriate metadata. The tone should be professional and engaging.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: metadataSchema,
      },
    }),
  ]);

  const base64ImageBytes = imageResponse.generatedImages[0]?.image?.imageBytes;
  if (!base64ImageBytes) {
    throw new Error('Image generation failed, no image bytes returned.');
  }

  const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
  const metadata = JSON.parse(metadataResponse.text);

  return {
    id,
    imageUrl,
    aspectRatio,
    alt: metadata.alt,
    title: metadata.title,
    caption: metadata.caption,
    description: metadata.description,
    prompt,
  };
};

export const generateRecipeImagesAndMetadata = async (
  recipeKeyword: string,
  ingredients: string,
  preparationSteps: string[]
): Promise<GeneratedImage[]> => {
  
  const tasks: ImageTask[] = [
    {
      prompt: `Main image of a finished plate of ${recipeKeyword}`,
      aspectRatio: '16:9',
      id: 'main-image',
    },
    {
      prompt: `A clean, minimalist flat-lay of fresh ingredients for ${recipeKeyword}, including: ${ingredients}. Crucially, each primary ingredient in the photo must have a small, clean, legible label with its abbreviated name written underneath or next to it. The labels should be subtle and elegant.`,
      aspectRatio: '3:4',
      id: 'ingredients-image',
    },
    ...preparationSteps.map((step, index) => ({
      prompt: `A close-up action shot of a chef performing this step: "${step}" for the ${recipeKeyword} recipe`,
      aspectRatio: '3:4' as AspectRatio,
      id: `step-${index + 1}`,
    })),
  ];

  const results = await Promise.all(tasks.map(generateImageAndMetadata));
  return results;
};
