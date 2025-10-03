import { z } from "zod";

export const AnswerCardSchema = z.object({
  title: z.string(),
  value: z.union([z.number(), z.string()]).optional(),
  unit: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const SeriesPointSchema = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number().nullable(),
});

export const ChartDataSchema = z.object({
  type: z.enum(["line", "bar"]),
  series: z.array(
    z.object({
      label: z.string(),
      points: z.array(SeriesPointSchema),
    })
  ),
});

export const SourceLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

export const QueryResultSchema = z.object({
  answer: AnswerCardSchema.optional(),
  chart: ChartDataSchema.optional(),
  sources: z.array(SourceLinkSchema),
  raw: z.unknown().optional(),
});

export const QueryRequestSchema = z.object({
  q: z.string().min(1),
  mode: z.enum(["exploratory", "analytical", "generative"]).optional(),
});

export type AnswerCard = z.infer<typeof AnswerCardSchema>;
export type SeriesPoint = z.infer<typeof SeriesPointSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type SourceLink = z.infer<typeof SourceLinkSchema>;
export type QueryResult = z.infer<typeof QueryResultSchema>;
export type QueryRequest = z.infer<typeof QueryRequestSchema>;

export function normalizeQueryString(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}
