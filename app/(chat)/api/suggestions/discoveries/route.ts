import {
  generatePersonalizedUserExperienceSuggestions,
  streamPartialPersonalizedUserExperienceSuggestions,
  streamTextPersonalizedUserExperienceSuggestions,
} from '@/actions/discoveries/discovery-suggestions';
import { getErrorMessage } from '@/lib/errors';
import { StatusCodes } from 'http-status-codes';
import type { NextRequest } from 'next/server';
// export const runtime = 'edge';
import { z } from 'zod';

enum Type {
  generate = 'object',
  stream = 'stream',
}

const typeSchema = z.nativeEnum(Type);
type typeModel = z.infer<typeof typeSchema>;

const paramsSchema = z.object({
  type: typeSchema,
  context: z.string().optional(),
  numOfSuggestions: z.number().optional(),
  city: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  interests: z.array(z.string()).optional(),
  fullStream: z.string().optional(),
});

type Params = z.infer<typeof paramsSchema>;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as typeModel;
    const typeValidation = typeSchema.safeParse(type);
    // const contextValidation = contextSchema.safeParse(context);

    if (!typeValidation.success) {
      const allParams = { type };
      return Response.json(
        { error: 'Invalid type parameters', params: allParams },
        { status: StatusCodes.BAD_REQUEST },
      );
    }

    const context = (searchParams.get('context') || '') as Params['context'];

    const numOfSuggestions = (searchParams.get('numOfSuggestions') ||
      4) as Params['numOfSuggestions'];

    const city = (searchParams.get('city') || '') as Params['city'];

    const latitude = (searchParams.get('latitude') ||
      undefined) as Params['latitude'];
    const longitude = (searchParams.get('longitude') ||
      undefined) as Params['longitude'];

    const geo = { city, latitude, longitude };

    const interests = (searchParams.get('interests') || '')
      .split('')
      .filter(Boolean) as Params['interests'];

    const isStream = type === Type.stream;

    if (isStream) {
      const fullStream = (searchParams.get('fullStream') ||
        'false') as Params['fullStream'];
      const isFullStream = fullStream === 'true';
      // console.log('Stream type detected', { fullStream, isFullStream });

      if (isFullStream) {
        return streamTextPersonalizedUserExperienceSuggestions(context, {
          numOfSuggestions: numOfSuggestions!,
          geolocation: geo,
          interests,
          fullStream: fullStream === 'true',
        });
      }

      // Partial stream
      const response = await streamPartialPersonalizedUserExperienceSuggestions(
        context,
        {
          numOfSuggestions: numOfSuggestions!,
          geolocation: geo,
          interests,
        },
      );

      return Response.json(response, { status: StatusCodes.OK });
    }

    // Standard object suggestion generation
    const suggestions = await generatePersonalizedUserExperienceSuggestions(
      context,
      {
        numOfSuggestions,
        geolocation: geo,
        interests,
      },
    );
    return Response.json(suggestions, { status: StatusCodes.OK });
  } catch (error) {
    const errMsg = getErrorMessage(error);
    return Response.json(
      { error: 'AI Discovery Suggestion API Error', message: errMsg },
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    );
  }
}
