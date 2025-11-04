import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { RegenerateIcon } from './icons/RegenerateIcon';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageCardProps {
  image: GeneratedImage;
  onRegenerate: (id: string) => void;
  isRegenerating?: boolean;
}

interface CopyableFieldProps {
    label: string;
    text: string;
}

const CopyableField: React.FC<CopyableFieldProps> = ({ label, text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</h4>
                <div className="flex items-center space-x-2">
                    {copied && <span className="text-xs text-green-500 font-semibold">Copied!</span>}
                    <button
                        onClick={handleCopy}
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        aria-label={`Copy ${label}`}
                    >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">{text}</p>
        </div>
    );
};


export const ImageCard: React.FC<ImageCardProps> = ({ image, onRegenerate, isRegenerating }) => {
  const [titleCopied, setTitleCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.imageUrl;
    const fileName = `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(image.title);
    setTitleCopied(true);
    setTimeout(() => setTitleCopied(false), 2000);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl">
      <div className="relative">
        <div className="aspect-w-16 aspect-h-9" style={{ aspectRatio: image.aspectRatio.replace(':', '/') }}>
          <img src={image.imageUrl} alt={image.alt} className={`w-full h-full object-cover transition-opacity ${isRegenerating ? 'opacity-50' : 'opacity-100'}`} />
        </div>
        
        {isRegenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center space-x-2">
           <button
            onClick={() => onRegenerate(image.id)}
            disabled={isRegenerating}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Regenerate image"
          >
            <RegenerateIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={isRegenerating}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white disabled:opacity-50"
            aria-label="Download image"
          >
            <DownloadIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-4 md:p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-2">{image.title}</h3>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {titleCopied && <span className="text-sm text-green-500 font-semibold">Copied!</span>}
            <button
                onClick={handleCopyTitle}
                className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-label="Copy title"
            >
                {titleCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="space-y-4 flex-grow">
          <CopyableField label="Alt Text" text={image.alt} />
          <CopyableField label="Caption" text={image.caption} />
          <CopyableField label="Description" text={image.description} />
        </div>
      </div>
    </div>
  );
};