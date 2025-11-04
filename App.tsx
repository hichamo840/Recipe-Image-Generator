
import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { GeneratedImage } from './types';
import { generateRecipeImagesAndMetadata, generateImageAndMetadata } from './services/geminiService';
import { InputField } from './components/InputField';
import { TextAreaField } from './components/TextAreaField';
import { ImageCard } from './components/ImageCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DownloadIcon } from './components/icons/DownloadIcon';

const App: React.FC = () => {
  const [recipeKeyword, setRecipeKeyword] = useState<string>('');
  const [ingredients, setIngredients] = useState<string>('');
  const [preparationSteps, setPreparationSteps] = useState<string>('');
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setRegeneratingId(null);

    try {
      const steps = preparationSteps.split('\n').filter(step => step.trim() !== '');
      if (!recipeKeyword || !ingredients || steps.length === 0) {
        setError('Please fill in all fields: recipe keyword, ingredients, and at least one preparation step.');
        setIsLoading(false);
        return;
      }
      
      const results = await generateRecipeImagesAndMetadata(recipeKeyword, ingredients, steps);
      setGeneratedImages(results);
    } catch (e) {
      console.error(e);
      setError('An error occurred while generating images. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [recipeKeyword, ingredients, preparationSteps]);

  const handleRegenerate = useCallback(async (id: string) => {
    const imageToRegenerate = generatedImages.find(img => img.id === id);
    if (!imageToRegenerate || regeneratingId) return;

    setRegeneratingId(id);
    setError(null);

    try {
      const newImage = await generateImageAndMetadata({
        id: imageToRegenerate.id,
        prompt: imageToRegenerate.prompt,
        aspectRatio: imageToRegenerate.aspectRatio,
      });
      
      setGeneratedImages(currentImages => 
        currentImages.map(img => (img.id === id ? newImage : img))
      );
    } catch (e) {
      console.error(e);
      setError(`Failed to regenerate image. Please try again.`);
    } finally {
      setRegeneratingId(null);
    }
  }, [generatedImages, regeneratingId]);

  const handleSaveAll = useCallback(async () => {
    if (generatedImages.length === 0) return;

    setIsZipping(true);
    setError(null);

    try {
      const zip = new JSZip();

      for (const image of generatedImages) {
        const base64Data = image.imageUrl.split(',')[1];
        const fileName = `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        zip.file(fileName, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      const zipFileName = `${recipeKeyword.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'recipe'}_images.zip`;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (e) {
      console.error("Failed to create zip file", e);
      setError("Could not create the zip file. Please try again.");
    } finally {
      setIsZipping(false);
    }
  }, [generatedImages, recipeKeyword]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <main className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            Recipe Image Generator
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bring your recipes to life. Describe your dish, list the ingredients, and outline the steps to instantly generate a collection of stunning, professional-quality images.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Recipe Details</h2>
            <div className="space-y-6">
              <InputField
                label="Name of Your Recipe"
                description="Tell the AI what dish you're making. The more specific, the better the image."
                value={recipeKeyword}
                onChange={(e) => setRecipeKeyword(e.target.value)}
                placeholder="Example: 'Spicy Thai Green Curry' or 'Grandma's Classic Apple Pie'."
              />
              <TextAreaField
                label="Your Ingredients"
                description="What goes into your recipe? List each ingredient on a new line. This helps the AI create a beautiful photo of just the ingredients."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder={"Example:\n1 cup fresh basil\n2 cloves garlic\n1/4 cup pine nuts\n1/2 cup parmesan cheese"}
                rows={8}
              />
              <TextAreaField
                label="Cooking Steps"
                description="How do you make the dish? Write down the main steps, one per line. The AI will choose the most exciting actions to turn into pictures."
                value={preparationSteps}
                onChange={(e) => setPreparationSteps(e.target.value)}
                placeholder={"Example:\nKnead the dough on a floured surface.\nSauté onions and garlic until golden brown.\nPour the creamy sauce over the pasta."}
                rows={10}
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading || !!regeneratingId || isZipping}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    Generating...
                  </>
                ) : (
                  'Generate Images'
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-8">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                 <LoadingSpinner size="lg"/>
                <p className="text-xl font-semibold mt-4 text-gray-700 dark:text-gray-300">Generating your delicious visuals...</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">This may take a few moments. Great art needs time!</p>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300">
                <p className="text-center">{error}</p>
              </div>
            )}
            {!isLoading && generatedImages.length > 0 && (
              <>
                <div className="flex justify-end mb-6">
                  <button
                    onClick={handleSaveAll}
                    disabled={isZipping}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isZipping ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Zipping...</span>
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        <span>Save All Images (.zip)</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedImages.map((image) => (
                    <div key={image.id} className={image.aspectRatio === '16:9' ? 'md:col-span-2' : ''}>
                      <ImageCard 
                        image={image}
                        onRegenerate={handleRegenerate}
                        isRegenerating={regeneratingId === image.id}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
             {!isLoading && !error && generatedImages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200">Your Image Gallery Awaits</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Fill out the recipe details and click "Generate Images" to see the magic happen!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
