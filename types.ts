
export type AspectRatio = '16:9' | '3:4' | '1:1' | '4:3' | '9:16';

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  alt: string;
  title: string;
  caption: string;
  description: string;
  aspectRatio: AspectRatio;
  prompt: string;
}
