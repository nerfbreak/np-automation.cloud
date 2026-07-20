"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { automationSchema, AutomationFormValues } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Bot, Plus, Trash2, Save, LayoutTemplate } from "lucide-react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { automationTemplates } from "@/mocks/templates"
import { InlineAlert } from "@/components/feedback/inline-alert"

function AutomationBuilderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template")
  const activeTemplate = templateId
    ? automationTemplates.find((t) => t.id === templateId)
    : null

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: activeTemplate?.defaultValues.name ?? "",
      description: activeTemplate?.defaultValues.description ?? "",
      owner: activeTemplate?.defaultValues.owner ?? "",
      tags: activeTemplate?.defaultValues.tags ?? [],
      payload: {
        targetUrl: activeTemplate?.defaultValues.payload?.targetUrl ?? "",
        headless: activeTemplate?.defaultValues.payload?.headless ?? true,
        timeoutMs: activeTemplate?.defaultValues.payload?.timeoutMs ?? 30000,
        background: activeTemplate?.defaultValues.payload?.background ?? false,
        steps: (activeTemplate?.defaultValues.payload?.steps ?? []) as AutomationFormValues["payload"]["steps"],
      },
    },
  })

  const { fields, append, remove } = useFieldArray({
    name: "payload.steps",
    control: form.control,
  })

  function onSubmit(data: AutomationFormValues) {
    console.log(data)
    toast.success("Automation created successfully!", {
      description: "It has been saved as a draft.",
    })
    router.push("/automations")
  }

  return (
    <AppShell breadcrumbs={[{ label: "Automations", href: "/automations" }, { label: "Create New" }]}>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Automation Builder</h1>
            <p className="text-muted-foreground mt-2">
              Create a new browser automation workflow.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {activeTemplate && (
              <InlineAlert
                variant="info"
                title={`Template aktif: ${activeTemplate.name}`}
              >
                Form telah diisi otomatis. Silakan sesuaikan isian sebelum menyimpan.
              </InlineAlert>
            )}
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  Basic details and metadata for this automation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Daily Ticket Export" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. IT Ops" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this automation does..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Tags (Comma separated)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Export, Daily, ServiceNow" 
                          value={Array.isArray(value) ? value.join(", ") : value}
                          onChange={(e) => onChange(e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Browser settings and execution parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="payload.targetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="payload.headless"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Headless Mode</FormLabel>
                          <FormDescription>
                            Run the browser in the background without a UI. Recommended for production.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payload.background"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Background Execution</FormLabel>
                          <FormDescription>
                            Allow this job to run asynchronously in a background queue.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Workflow Steps</CardTitle>
                  <CardDescription>
                    Define the sequence of browser actions to execute.
                  </CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => append({ 
                    id: Date.now(), 
                    name: "", 
                    action: "click", 
                    selectorType: "css", 
                    selector: "", 
                    value: "" 
                  })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
                    <Bot className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground text-sm">No steps defined yet.</p>
                    <p className="text-muted-foreground text-sm">Click "Add Step" to begin building your workflow.</p>
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-muted/20 relative group">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Step {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`payload.steps.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Step Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Click Login" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`payload.steps.${index}.action`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Action</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an action" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="click">Click Element</SelectItem>
                                    <SelectItem value="type">Type Text</SelectItem>
                                    <SelectItem value="select">Select Option</SelectItem>
                                    <SelectItem value="wait">Wait for Element</SelectItem>
                                    <SelectItem value="screenshot">Take Screenshot</SelectItem>
                                    <SelectItem value="download">Download File</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`payload.steps.${index}.selector`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Selector</FormLabel>
                                <FormControl>
                                  <Input placeholder="#login-btn or .input-field" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Automation
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppShell>
  )
}

export default function AutomationBuilderPage() {
  return (
    <Suspense fallback={
      <AppShell breadcrumbs={[{ label: "Automations", href: "/automations" }, { label: "New Automation" }]}>
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading...</div>
      </AppShell>
    }>
      <AutomationBuilderForm />
    </Suspense>
  )
}
