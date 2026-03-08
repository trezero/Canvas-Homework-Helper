import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAllowanceSettingsSchema, type AllowanceSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";

export function AllowanceSettingsModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { toast } = useToast();

    const { data: settings, isLoading } = useQuery<AllowanceSettings>({
        queryKey: ["/api/allowance-settings"],
        enabled: open,
    });

    const formSchema = insertAllowanceSettingsSchema.extend({
        minAllowance: z.coerce.number().min(0, "Must be positive"),
        maxAllowance: z.coerce.number().min(0, "Must be positive"),
        periodWeeks: z.coerce.number().min(1).max(4),
    }).omit({ userId: true, studentId: true });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            isEnabled: false,
            minAllowance: 50,
            maxAllowance: 100,
            periodWeeks: 1,
        },
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                isEnabled: settings.isEnabled ?? false,
                minAllowance: settings.minAllowance ?? 50,
                maxAllowance: settings.maxAllowance ?? 100,
                periodWeeks: settings.periodWeeks ?? 1,
            });
        }
    }, [settings, form]);

    const maxAllowanceVal = form.watch("maxAllowance");
    const isEnabled = form.watch("isEnabled");

    const [suggestedMin, setSuggestedMin] = useState<{ value: number; missing: number } | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [userEditedMin, setUserEditedMin] = useState(false);

    useEffect(() => {
        if (!open || !isEnabled) return;
        const fetchSuggestion = async () => {
            if (!maxAllowanceVal || maxAllowanceVal <= 0 || isNaN(maxAllowanceVal)) return;
            setIsSuggesting(true);
            try {
                const res = await fetch(`/api/suggested-min-allowance?maxAllowance=${maxAllowanceVal}`);
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();
                setSuggestedMin({ value: data.suggestedMinAllowance, missing: data.missingCount });

                if (!userEditedMin && !settings?.minAllowance) {
                    form.setValue("minAllowance", data.suggestedMinAllowance);
                }
            } catch (e) {
                // silently fail for suggestions
            } finally {
                setIsSuggesting(false);
            }
        };

        const timer = setTimeout(fetchSuggestion, 500);
        return () => clearTimeout(timer);
    }, [maxAllowanceVal, open, isEnabled, form, userEditedMin, settings?.minAllowance]);

    const saveMutation = useMutation({
        mutationFn: async (data: z.infer<typeof formSchema>) => {
            const res = await apiRequest("POST", "/api/allowance-settings", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/allowance-settings"] });
            toast({ title: "Settings Saved", description: "Allowance settings updated successfully." });
            onOpenChange(false);
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        if (data.minAllowance > data.maxAllowance) {
            form.setError("minAllowance", { type: "manual", message: "Cannot exceed Max Allowance." });
            return;
        }
        saveMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Allowance Settings</DialogTitle>
                    <DialogDescription className="sr-only">Allowance Configuration Form</DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Allowance Tracking</Label>
                                <div className="text-[13px] text-muted-foreground">
                                    Set rewards to motivate completion of missing work.
                                </div>
                            </div>
                            <Switch
                                checked={form.watch("isEnabled")}
                                onCheckedChange={(val) => form.setValue("isEnabled", val)}
                            />
                        </div>

                        {form.watch("isEnabled") && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label>Maximum Allowance ($)</Label>
                                    <Input
                                        type="number"
                                        {...form.register("maxAllowance")}
                                        onChange={(e) => {
                                            form.setValue("maxAllowance", e.target.valueAsNumber);
                                        }}
                                    />
                                    {form.formState.errors.maxAllowance && <p className="text-xs text-red-500">{form.formState.errors.maxAllowance.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Base Minimum Allowance ($)</Label>
                                    <Input
                                        type="number"
                                        {...form.register("minAllowance")}
                                        onChange={(e) => {
                                            setUserEditedMin(true);
                                            form.setValue("minAllowance", e.target.valueAsNumber);
                                        }}
                                    />
                                    {form.formState.errors.minAllowance && <p className="text-xs text-red-500">{form.formState.errors.minAllowance.message}</p>}

                                    {isSuggesting ? (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Calculating suggestion...
                                        </div>
                                    ) : suggestedMin && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 bg-muted/50 p-2 rounded-md border text-left">
                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            Suggested ${suggestedMin.value} base allowance given {suggestedMin.missing} missing assignment(s).
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Frequency Period</Label>
                                    <Select
                                        value={String(form.watch("periodWeeks"))}
                                        onValueChange={(val) => form.setValue("periodWeeks", parseInt(val))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Every 1 Week</SelectItem>
                                            <SelectItem value="2">Every 2 Weeks</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Periods align to automatically start on Monday.
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
