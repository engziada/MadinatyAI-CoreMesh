import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiComplexity } from '@madinatyai/common';
import { AiRouterService } from './ai-router.service';

function makeConfig(overrides: Record<string, unknown> = {}): ConfigService {
  const values: Record<string, unknown> = {
    'ai.ollamaBaseUrl': 'http://localhost:11434',
    'ai.ollamaTimeoutMs': 1000,
    'ai.ollamaModel': 'llama3:8b',
    'ai.geminiModel': 'gemini-1.5-pro',
    'ai.geminiEmbedModel': 'text-embedding-004',
    'ai.geminiApiKey': '',
    ...overrides,
  };
  return { get: (k: string) => values[k] } as unknown as ConfigService;
}

describe('AiRouterService', () => {
  it('routes COMPLEXITY_LOW to the local Ollama endpoint', async () => {
    const service = new AiRouterService(makeConfig());
    const post = jest.fn().mockResolvedValue({ data: { response: 'pong' } });
    (service as unknown as { http: { post: jest.Mock } }).http = { post } as never;

    const result = await service.process({ text: 'ping', complexity: AiComplexity.COMPLEXITY_LOW });

    expect(post).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ stream: false }));
    expect(result.provider).toBe('ollama');
    expect(result.output).toBe('pong');
  });

  it('surfaces Ollama failures as ServiceUnavailable', async () => {
    const service = new AiRouterService(makeConfig());
    (service as unknown as { http: { post: jest.Mock } }).http = {
      post: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    } as never;

    await expect(
      service.process({ text: 'x', complexity: AiComplexity.COMPLEXITY_LOW }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects COMPLEXITY_HIGH when no Gemini API key is configured', async () => {
    const service = new AiRouterService(makeConfig());
    await expect(
      service.process({ text: 'x', complexity: AiComplexity.COMPLEXITY_HIGH }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
