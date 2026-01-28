import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

export class GeminiService {
    async chat(
        messages: Array<{
            role: 'system' | 'user' | 'assistant';
            content: string;
            media?: { mimeType: string; data: Buffer }
        }>,
        model: string = 'gemini-pro'
    ): Promise<{
        content: string;
        tokensUsed: number | null;
    }> {
        try {
            const geminiModel = genAI.getGenerativeModel({ model });
            const systemPrompt = messages.find((m) => m.role === 'system')?.content || '';
            const history = messages
                .filter((m) => m.role !== 'system')
                .map((m) => {
                    const parts: any[] = [{ text: m.content }];
                    if (m.media) {
                        parts.push({
                            inlineData: {
                                mimeType: m.media.mimeType,
                                data: m.media.data.toString('base64')
                            }
                        });
                    }
                    return {
                        role: m.role === 'user' ? 'user' : 'model',
                        parts: parts,
                    };
                });

            const lastUserMessage = history.pop();

            if (!lastUserMessage) {
                throw new Error('No user message found');
            }

            const chat = geminiModel.startChat({
                history: history.length > 0 ? history : undefined,
                generationConfig: {
                    maxOutputTokens: 2048,
                },
            });

            const messageText = systemPrompt
                ? [{ text: systemPrompt }, ...lastUserMessage.parts]
                : lastUserMessage.parts;

            const result = await chat.sendMessage(messageText);
            const response = result.response;

            return {
                content: response.text(),
                tokensUsed: null,
            };
        } catch (error) {
            logger.error('Gemini API error:', error);
            throw new Error('Failed to get response from Gemini');
        }
    }

    async generateImage(messages: Array<{ role: string; content: string; media?: { mimeType: string; data: Buffer } }>): Promise<{ content: string; media: { mimeType: string; data: Buffer }[] }> {
        try {
            const modelName = "gemini-2.5-flash-image";
            const apiKey = env.GEMINI_API_KEY;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            // Extract system prompt
            const systemMessage = messages.find(m => m.role === 'system');
            const systemPrompt = systemMessage ? systemMessage.content : '';

            // Filter out system message from history for the contents array
            // Map roles: 'user' -> 'user', 'assistant' -> 'model'
            const contents = messages
                .filter(m => m.role !== 'system')
                .map(m => {
                    const parts: any[] = [{ text: m.content }];
                    if (m.media) {
                        parts.push({
                            inlineData: {
                                mimeType: m.media.mimeType,
                                data: m.media.data.toString('base64')
                            }
                        });
                    }
                    return {
                        role: m.role === 'user' ? 'user' : 'model',
                        parts: parts
                    };
                });

            const payload = {
                contents: contents,
                system_instruction: systemPrompt ? {
                    parts: [{ text: systemPrompt }]
                } : undefined,
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"],
                    speechConfig: undefined
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();

                if (response.status === 429) {
                    throw new Error("Google AI Quota Exceeded (429). The 'Nano Banana' model may require a paid account or you have hit the free tier limit. See: https://ai.google.dev/pricing");
                }

                throw new Error(`Gemini API Error ${response.status}: ${errText}`);
            }

            const data = await response.json() as any;
            const parts = data.candidates?.[0]?.content?.parts || [];

            if (parts.length === 0) {
                throw new Error('No content returned from Gemini');
            }

            let content = "";
            const media: { mimeType: string; data: Buffer }[] = [];

            for (const part of parts) {
                if (part.text) {
                    content += part.text + "\n";
                }

                if (part.inlineData) {
                    const base64Data = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    const buffer = Buffer.from(base64Data, 'base64');

                    media.push({
                        mimeType,
                        data: buffer
                    });
                }
            }

            return {
                content: content || "No response content generated.",
                media
            };

        } catch (error: any) {
            logger.error('Gemini Image Generation error:', error);
            throw new Error(`Failed to generate image with Gemini: ${error.message}`);
        }
    }

    async generateVideo(prompt: string): Promise<{ content: string; media: { mimeType: string; data: Buffer }[] }> {
        try {
            // Check if VEO_KEY is set, otherwise warn
            if (!process.env.VEO_KEY) {
                logger.warn('VEO_KEY is not set, using default GEMINI_KEY which might not have access.');
            }

            const apiKey = process.env.VEO_KEY || env.GEMINI_API_KEY;
            const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
            const modelName = 'veo-3.1-generate-preview';

            // 1. Initiate Long-Running Operation
            const initialUrl = `${baseUrl}/models/${modelName}:predictLongRunning?key=${apiKey}`;

            const payload = {
                instances: [
                    { prompt: prompt }
                ],
                parameters: {
                    aspectRatio: "16:9",
                    negativePrompt: "cartoon, drawing, low quality, glitch, distorted, blurry"
                }
            };

            logger.info(`Starting Veo 3.1 video generation with prompt: ${prompt.substring(0, 50)}...`);

            const initialResponse = await fetch(initialUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!initialResponse.ok) {
                const errText = await initialResponse.text();
                throw new Error(`Veo Init API Error ${initialResponse.status}: ${errText}`);
            }

            const initialData = await initialResponse.json() as any;
            const operationName = initialData.name; // e.g., "operations/..."

            if (!operationName) {
                throw new Error('No operation name returned from Veo 3.1 initialization');
            }

            logger.info(`Veo operation started: ${operationName}`);

            // 2. Poll for completion
            let videoUri: string | null = null;
            let attempts = 0;
            const maxAttempts = 60; // 10 minutes (10s interval)

            while (attempts < maxAttempts) {
                // Wait 10 seconds
                await new Promise(resolve => setTimeout(resolve, 10000));

                const pollUrl = `${baseUrl}/${operationName}?key=${apiKey}`;
                const pollResponse = await fetch(pollUrl);

                if (!pollResponse.ok) {
                    const errText = await pollResponse.text();
                    logger.error(`Polling error: ${errText}`);
                    // Continue polling? Or abort? Let's throw for now as infrastructure seems unstable if this fails
                    // throw new Error(`Veo Polling API Error ${pollResponse.status}: ${errText}`);
                    continue;
                }

                const pollData = await pollResponse.json() as any;

                if (pollData.done) {
                    if (pollData.error) {
                        throw new Error(`Veo generation failed: ${JSON.stringify(pollData.error)}`);
                    }

                    // Extract logic based on REST response structure for Veo 3.1
                    // Structure: response.generateVideoResponse.generatedSamples[0].video.uri
                    const samples = pollData.response?.generateVideoResponse?.generatedSamples;
                    if (samples && samples.length > 0 && samples[0].video?.uri) {
                        videoUri = samples[0].video.uri;
                        break;
                    } else {
                        // Sometimes structure might be different or empty?
                        throw new Error('Operation done but no video URI found in response');
                    }
                }

                attempts++;
                logger.info(`Waiting for Veo video... Attempt ${attempts}/${maxAttempts}`);
            }

            if (!videoUri) {
                throw new Error('Video generation timed out or failed to return a URI');
            }

            logger.info(`Video generated! Downloading from: ${videoUri}`);

            // 3. Download the video
            // Check if URI needs API key? Docs say: curl -H "x-goog-api-key: $KEY" "URI"
            const downloadResponse = await fetch(videoUri, {
                headers: {
                    'x-goog-api-key': apiKey
                }
            });

            if (!downloadResponse.ok) {
                throw new Error(`Failed to download generated video: ${downloadResponse.statusText}`);
            }

            const arrayBuffer = await downloadResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            logger.info(`Video downloaded successfully. Size: ${buffer.length} bytes`);

            return {
                content: "¡Video generado exitosamente!",
                media: [{
                    mimeType: 'video/mp4',
                    data: buffer
                }]
            };

        } catch (error: any) {
            logger.error('Veo Video Generation error:', error);
            throw new Error(`Failed to generate video with Veo: ${error.message}`);
        }
    }
}
