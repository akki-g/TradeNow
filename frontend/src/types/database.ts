import { z } from 'zod';

export const DatabaseColumnSchema = z.object({
  name: z.string(),
  data_type: z.string(),
  is_nullable: z.boolean(),
  is_primary_key: z.boolean(),
  default: z.string().nullable().optional(),
});

export const ForeignKeyReferenceSchema = z.object({
  column_name: z.string(),
  referenced_table: z.string(),
  referenced_column: z.string(),
  on_delete: z.string().nullable().optional(),
});

export const DatabaseRowSchema = z.record(z.string(), z.unknown());

export const DatabaseTableOverviewSchema = z.object({
  table_name: z.string(),
  row_count: z.number(),
  columns: z.array(DatabaseColumnSchema),
  foreign_keys: z.array(ForeignKeyReferenceSchema),
  sample_rows: z.array(DatabaseRowSchema),
});

export const DatabaseOverviewSchema = z.object({
  schema: z.string(),
  generated_at: z.string(),
  total_tables: z.number(),
  total_rows: z.number(),
  tables: z.array(DatabaseTableOverviewSchema),
});

export const DatabaseTableRowsSchema = z.object({
  table_name: z.string(),
  total_rows: z.number(),
  limit: z.number(),
  offset: z.number(),
  rows: z.array(DatabaseRowSchema),
});

export type DatabaseColumn = z.infer<typeof DatabaseColumnSchema>;
export type ForeignKeyReference = z.infer<typeof ForeignKeyReferenceSchema>;
export type DatabaseRow = z.infer<typeof DatabaseRowSchema>;
export type DatabaseTableOverview = z.infer<typeof DatabaseTableOverviewSchema>;
export type DatabaseOverview = z.infer<typeof DatabaseOverviewSchema>;
export type DatabaseTableRowsResponse = z.infer<typeof DatabaseTableRowsSchema>;
