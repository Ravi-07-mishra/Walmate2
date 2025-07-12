// This is a server-side file.
'use server';

/**
 * @fileOverview AI agent that displays suggested products in a horizontal slideshow carousel.
 *
 * - displaySuggestedProducts - A function that displays products in a carousel.
 * - DisplaySuggestedProductsInput - The input type for the displaySuggestedProducts function.
 * - DisplaySuggestedProductsOutput - The return type for the displaySuggestedProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DisplaySuggestedProductsInputSchema = z.object({
  query: z.string().describe('The query to use to find the suggested products.'),
});

export type DisplaySuggestedProductsInput = z.infer<typeof DisplaySuggestedProductsInputSchema>;

const ProductSchema = z.object({
  name: z.string().describe('The name of the product.'),
  price: z.number().describe('The price of the product in INR.'),
  imageUrl: z.string().describe('URL of the product image.'),
  description: z.string().optional().describe('A short description of the product.'),
  productUrl: z.string().optional().describe('URL of the product page.'),
});

const DisplaySuggestedProductsOutputSchema = z.array(ProductSchema).describe('An array of suggested products.');

export type DisplaySuggestedProductsOutput = z.infer<typeof DisplaySuggestedProductsOutputSchema>;

export async function displaySuggestedProducts(input: DisplaySuggestedProductsInput): Promise<DisplaySuggestedProductsOutput> {
  return displaySuggestedProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'displaySuggestedProductsPrompt',
  input: {schema: DisplaySuggestedProductsInputSchema},
  output: {schema: DisplaySuggestedProductsOutputSchema},
  prompt: `You are a shopping assistant.  Find products based on the following query: {{{query}}}.
      Return a JSON array of products that match the following schema:
      \n${JSON.stringify(ProductSchema)}\n`,
});

const displaySuggestedProductsFlow = ai.defineFlow(
  {
    name: 'displaySuggestedProductsFlow',
    inputSchema: DisplaySuggestedProductsInputSchema,
    outputSchema: DisplaySuggestedProductsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      return [];
    }
    try {
      return JSON.parse(JSON.stringify(output));
    } catch (e) {
      console.error('Error parsing product suggestions', e);
      return [];
    }
  }
);
