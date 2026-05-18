// src/storage/schemas.ts
import { z } from "zod";
var ElementInfoSchema = z.object({
  tagName: z.string(),
  id: z.string().optional(),
  classNames: z.array(z.string()),
  selector: z.string(),
  textContent: z.string().optional(),
  boundingRect: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }),
  computedStyles: z.record(z.string(), z.string()).optional(),
  ariaAttributes: z.record(z.string(), z.string()).optional(),
  dataAttributes: z.record(z.string(), z.string()).optional(),
  domPath: z.string().optional()
});
var FrameworkInfoSchema = z.object({
  framework: z.string(),
  componentPath: z.string(),
  sourceFile: z.string().optional(),
  frameworkVersion: z.string().optional()
});
var PinStatusSchema = z.enum([
  "open",
  "acknowledged",
  "resolved",
  "dismissed"
]);
var PinSchema = z.object({
  id: z.string().uuid(),
  pageUrl: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: z.string().optional(),
  comment: z.string(),
  element: ElementInfoSchema,
  framework: FrameworkInfoSchema.optional(),
  status: z.object({
    state: PinStatusSchema,
    changedAt: z.string().datetime(),
    changedBy: z.string().optional()
  })
});

export {
  ElementInfoSchema,
  FrameworkInfoSchema,
  PinSchema
};
//# sourceMappingURL=chunk-JCYY4S7A.js.map