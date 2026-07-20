import * as z from "zod"

export const automationStepSchema = z.object({
  id: z.number(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  action: z.enum(["click", "type", "wait", "select", "download", "screenshot"]),
  selectorType: z.enum(["element_id", "css", "xpath", "text"]).optional(),
  selector: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
})

export const automationPayloadSchema = z.object({
  targetUrl: z.string().url("Must be a valid URL."),
  headless: z.boolean(),
  timeoutMs: z.number().min(1000).max(300000),
  background: z.boolean(),
  steps: z.array(automationStepSchema),
})

export const automationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(50),
  description: z.string().max(200).optional(),
  owner: z.string().min(2, "Owner is required."),
  tags: z.array(z.string()),
  payload: automationPayloadSchema,
})

export type AutomationFormValues = z.infer<typeof automationSchema>
export type AutomationStepFormValues = z.infer<typeof automationStepSchema>
