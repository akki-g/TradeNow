import { z } from "zod";

export const IndicatorParamSchema = z.object({
    name: z.string(),
    param_type: z.string(),
    default: z.any(),
    min_val: z.number().optional(),
    max_val: z.number().optional()
})

export const IndicatorSummarySchema = z.object({
    name: z.string(),
    display_name: z.string(),
    category: z.string()
})

export const IndicatorDetailSchema = z.object({
    name: z.string(),
    display_name: z.string(),
    category: z.string(),
    output_type: z.string(),
    params: z.array(IndicatorParamSchema),
    output_names: z.array(z.string())
})

export const ParamsSchema = z.record(z.string(), z.unknown())
export const CalculateRequestSchema = z.object({
    ticker: z.string(),
    indicator_name: z.string(),
    params: ParamsSchema,
    period: z.string().default("1y")
})

export const IndicatorDataPointSchema = z.object({
    time: z.coerce.date(),
    value: z.number().optional()
})

export const DataSchema= z.record(
    z.string(),
    z.array(IndicatorDataPointSchema)
)

export const CalculateResponseSchema = z.object({
    indicator: z.string(),
    output_type: z.string(),
    data: DataSchema
})

export const BatchIndicatorItemSchema= z.object({
    name: z.string(),
    params: ParamsSchema
})  

export const BatchCalculateRequestSchema = z.object({
    ticker: z.string(),
    period: z.string(),
    indicators: z.array(BatchIndicatorItemSchema)
})

export const BatchCalculateResponseSchema = z.object({
    ticker: z.string(),
    results: z.array(CalculateResponseSchema)
})

export type IndicatorParam = z.infer<typeof IndicatorParamSchema>;
export type IndicatorSummary = z.infer<typeof IndicatorSummarySchema>;
export type IndicatorDetail = z.infer<typeof IndicatorDetailSchema>;
export type CalculateRequest = z.infer<typeof CalculateRequestSchema>;
export type IndicatorDataPoint = z.infer<typeof IndicatorDataPointSchema>;
export type CalculateResponse = z.infer<typeof CalculateResponseSchema>;
export type BatchIndicatorItem = z.infer<typeof BatchIndicatorItemSchema>;
export type BatchCalculateRequest = z.infer<typeof BatchCalculateRequestSchema>;
export type BatchCalculateResponse = z.infer<typeof BatchCalculateResponseSchema>;


export type Params = z.infer<typeof ParamsSchema>;
export type Data = z.infer<typeof DataSchema>;


