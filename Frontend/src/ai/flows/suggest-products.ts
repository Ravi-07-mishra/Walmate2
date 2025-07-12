'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting products based on user input.
 *
 * - suggestProducts - A function that takes user input (text, voice, or image) and returns product suggestions.
 * - SuggestProductsInput - The input type for the suggestProducts function.
 * - SuggestProductsOutput - The return type for the suggestProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductsInputSchema = z.object({
  textInput: z.string().optional().describe('Text input from the user.'),
  voiceInputDataUri: z.string().optional().describe(
    "Voice input from the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  imageInputDataUri: z.string().optional().describe(
    "Image input from the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type SuggestProductsInput = z.infer<typeof SuggestProductsInputSchema>;

const SuggestProductsOutputSchema = z.object({
  productSuggestions: z.array(
    z.object({
      name: z.string().describe('The name of the suggested product.'),
      description: z.string().describe('A short description of the product.'),
      imageUrl: z.string().describe('URL of the product image.'),
      productUrl: z.string().describe('URL of the product page.'),
      price: z.number().describe('Price of the product in INR.'),
    })
  ).describe('An array of product suggestions.'),
});
export type SuggestProductsOutput = z.infer<typeof SuggestProductsOutputSchema>;

export async function suggestProducts(input: SuggestProductsInput): Promise<SuggestProductsOutput> {
  return suggestProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductsPrompt',
  input: {schema: SuggestProductsInputSchema},
  output: {schema: SuggestProductsOutputSchema},
  prompt: `You are a shopping assistant. Based on the user's input, suggest relevant products.

  Consider the following:
  - If the user provides text input, use it to understand their needs and preferences.
  - If the user provides voice input, transcribe it to understand their needs and preferences.
  - If the user provides an image, analyze it to understand their needs and preferences.

  Combine all available information to generate the best product suggestions.

  Here's the user's input:
  {{#if textInput}}
  Text: {{{textInput}}}
  {{/if}}
  {{#if voiceInputDataUri}}
  Voice: {{media url=voiceInputDataUri}}
  {{/if}}
  {{#if imageInputDataUri}}
  Image: {{media url=imageInputDataUri}}
  {{/if}}
  `,
});

const suggestProductsFlow = ai.defineFlow(
  {
    name: 'suggestProductsFlow',
    inputSchema: SuggestProductsInputSchema,
    outputSchema: SuggestProductsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
