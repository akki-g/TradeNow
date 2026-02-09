import { z } from "zod";

export const IndicatorParamSchema = z.object({
    name: z.string(),
    param_type: z.string(),
    default: z.any(),
    min_val: z.number().optional(),
    max_val: z.number().optional()
})

export const IndicatorSummary = z.object({
    name: z.string(),
    display_name: z.string(),
    category: z.string()
})

export const IndicatorDetail = z.object({
    name: z.string(),
    display_name: z.string(),
    category: z.string(),
    output_type: z.string(),
    params: z.array(IndicatorParamSchema),
    output_names: z.array(z.string())
})

export const ParamsSchema = z.record(z.string(), z.unknown())
export const CalculateRequest = z.object({
    ticker: z.string(),
    indicator_name: z.string(),
    params: ParamsSchema,
    period: z.string().default("1y")
})

export const IndicatorDataPoint = z.object({
    time: z.date(),
    value: z.number().optional()
})

export const DataSchema = z.record(
    z.string(),
    z.array(IndicatorDataPoint)
)

export const CalculateResponse = z.object({
    indicator: z.string(),
    output_type: z.string(),
    data: DataSchema
})

export const BatchIndicatorItem = z.object({
    name: z.string(),
    params: ParamsSchema
})  

export const BatchCalculateRequest = z.object({
    ticker: z.string(),
    period: z.string(),
    indicators: z.array(BatchIndicatorItem)
})

export const BatchCalculateResponse = z.object({
    ticker: z.string(),
    results: z.array(CalculateResponse)
})

