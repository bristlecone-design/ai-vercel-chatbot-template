import { z } from 'zod';

/**
 * Charging Station Options / Details
 */
export const chargingStationOptionAggregationSchema = z.object({
  type: z.string().optional(),
  maxChargeRateKw: z.number(),
  count: z.number(),
  availableCount: z.number().optional(),
  outOfServiceCount: z.number().optional(),
  availabilityLastUpdateTime: z.string().optional(),
});

export type ChargingStationOptionAggregationType = z.infer<
  typeof chargingStationOptionAggregationSchema
>;

export const chargingStationOptionsSchema = z.object({
  connectorCount: z.number().default(0),
  connectorAggregation: z.array(chargingStationOptionAggregationSchema),
});

export type ChargingStationOptionsType = z.infer<
  typeof chargingStationOptionsSchema
>;

/**
 * Conversational charging stations
 */
export const chargingStationSchema = z.object({
  provider: z
    .array(z.string())
    .default(['Any'])
    .describe(
      `The provider(s) of the charging station to retrieve context for, e.g. Any, Tesla, ChargePoint, etc.`,
    ),
  municipality: z
    .array(z.string())
    .describe(
      `The municipality(ies) of the charging station(s) based on prompt and/or context, e.g. Las Vegas, Reno, etc.`,
    ),
  vehicleBrand: z
    .array(z.string())
    .optional()
    .describe(
      `The vehicle brand(s) of the charging station to retrieve context for, e.g. Tesla, Nissan, etc.`,
    ),
  options: chargingStationOptionsSchema.optional(),
});

export type ChargingStationType = z.infer<typeof chargingStationSchema>;

export const chargingStationListSchema = z.array(chargingStationSchema);

export type ChargingStationListType = z.infer<typeof chargingStationListSchema>;

export const chargingStationsToolSchema = chargingStationSchema.merge(
  z.object({
    query: z
      .string()
      .describe(
        `A concise version of the original user query to retrieve context for inquiries around charging stations.`,
      ),
    translatedQuery: z
      .string()
      .describe(`The concise, English version of the user query.`),
    municipality: z
      .array(z.string())
      .describe(
        `The municipality(ies) of the query to retrieve context for, e.g. Las Vegas, Reno, Tonopah, etc.`,
      ),
    locationName: z
      .array(z.string())
      .default([''])
      .describe(
        `The location name(s) or area region of the query to retrieve context for, e.g. The Eldorado, McDonalds, Downtown Reno, South Carson City, etc.`,
      ),
    provider: z
      .array(z.string())
      .default(['Any'])
      .describe(
        `The provider(s) of the charging station to retrieve context for, e.g. Any, Tesla, ChargePoint, etc.`,
      ),
    requestingFastCharging: z
      .boolean()
      .default(false)
      .describe(
        `A boolean flag to indicate if the user is explicitly requesting fast charging or supercharging.`,
      ),
    queryingRequestNotice: z
      .string()
      .default('')
      .describe(
        `A succinct and contextual text notification for the user when action is taken on their query. Text is in user's original language. For example, you might say: "Looking up charging stations in [municipality] for you..." where [municipality] is the town/city relating to the user's inquiry.`,
      ),
    analyzingRequestNotice: z
      .string()
      .default('Reviewing charging info...')
      .describe(
        `A succinct and contextual text notification for the user when analyzing contextual info found based on their query. Text is in user's original language. For example, you might say: "Analyzing info on {query topic}..." where {query topic} is replaced with the topic relating to the user's inquiry.`,
      ),
  }),
);

export type ChargingStationsToolType = z.infer<
  typeof chargingStationsToolSchema
>;
