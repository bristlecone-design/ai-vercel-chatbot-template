import {
  type CoreToolCallUnion,
  type CoreToolResultUnion,
  type DataStreamWriter,
  tool,
} from 'ai';
import { z } from 'zod';
import type { customModel } from '..';

export type WeatherToolCall = CoreToolCallUnion<
  ReturnType<typeof getWeathereatherToolDefinition>
>;

export type WeatherToolResult = CoreToolResultUnion<
  ReturnType<typeof getWeathereatherToolDefinition>
>;

export type WeatherToolOpts = Record<string, never>;

export const getWeathereatherToolWrapper = (
  ...args: Parameters<typeof getWeathereatherToolDefinition>
) => {
  return getWeathereatherToolDefinition(...args);
};

export function getWeathereatherToolDefinition(
  llmModel?: ReturnType<typeof customModel>,
  dataStream?: DataStreamWriter,
  opts = {} as WeatherToolOpts,
) {
  // const {} = opts;

  return {
    // name: 'getWeather' as AllowedTools,
    getWeather: tool({
      description: 'Get the current weather at a location',
      parameters: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      execute: async ({ latitude, longitude }) => {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
        );

        const weatherData = await response.json();
        return weatherData;
      },
    }),
  };
}
