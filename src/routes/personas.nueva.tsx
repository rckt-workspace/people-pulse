import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/pc/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/personas/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva persona — People Hub" },
      { name: "description", content: "Alta de un nuevo colaborador con sus indicadores de rol." },
      { property: "og:title", content: "Nueva persona — People Hub" },
      { property: "og:description", content: "Alta de un colaborador y sus indicadores." },
    ],
  }),
  component: NuevaPersona,
});

type IndicatorDraft = {
  name: string;
  description: string;
  target_value: string;
  current_value: string;
  unit: string;
  weight: string;
};

const emptyIndicator: IndicatorDraft = {
  name: "",
  description: "",
  target_value: "",
  current_value: "",
  unit: "",
  weight: "",
};

function NuevaPersona() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    full_name: "",
    job_title: "",
    area: "",
    leader_name: "",
    evaluation_period: "",
    general_responsibilities: "",
  });
  const [indicators, setIndicators] = useState<IndicatorDraft[]>([{ ...emptyIndicator }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateIndicator = (index: number, key: keyof IndicatorDraft, value: string) =>
    setIndicators((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next['full_name'] = "El nombre completo es obligatorio.";
    if (!form.job_title.trim()) next['job_title'] = "El cargo es obligatorio.";
    if (!form.area.trim()) next['area'] = "El área es obligatoria.";
    if (!form.leader_name.trim()) next['leader_name'] = "El líder o responsable es obligatorio.";
    if (!form.evaluation_period.trim()) next['evaluation_period'] = "El periodo es obligatorio.";

    indicators.forEach((indicator, index) => {
      const hasContent = Object.values(indicator).some((value) => value.trim() !== "");
      if (!hasContent) return;
      if (!indicator.name.trim()) next[`indicator-${index}-name`] = "Indica un nombre.";
      for (const key of ["target_value", "current_value", "weight"] as const) {
        const value = indicator[key];
        if (value.trim() !== "" && Number.isNaN(Number(value))) {
          next[`indicator-${index}-${key}`] = "Debe ser un valor numérico.";
        }
      }
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          full_name: form.full_name.trim(),
          job_title: form.job_title.trim(),
          area: form.area.trim(),
          leader_name: form.leader_name.trim(),
          evaluation_period: form.evaluation_period.trim(),
          general_responsibilities: form.general_responsibilities.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const rows = indicators
        .filter((indicator) => indicator.name.trim() !== "")
        .map((indicator) => ({
          employee_id: data.id,
          name: indicator.name.trim(),
          description: indicator.description.trim() || null,
          target_value: indicator.target_value ? Number(indicator.target_value) : null,
          current_value: indicator.current_value ? Number(indicator.current_value) : null,
          unit: indicator.unit.trim() || null,
          weight: indicator.weight ? Number(indicator.weight) : null,
        }));

      if (rows.length > 0) {
        const { error: indicatorError } = await supabase.from("indicators").insert(rows);
        if (indicatorError) throw indicatorError;
      }

      return data.id as string;
    },
    onSuccess: async (id) => {
      toast.success("Persona creada correctamente");
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate({ to: "/personas/$id", params: { id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nueva persona"
        subtitle="Registra al colaborador y los indicadores asociados a su rol."
        actions={
          <Button variant="ghost" onClick={() => navigate({ to: "/personas" })}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
        }
      />

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (validate()) mutation.mutate();
        }}
      >
        <Panel title="Información general">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Nombre completo"
              value={form.full_name}
              onChange={(v) => setField("full_name", v)}
              error={errors['full_name']}
              placeholder="Ej. Anyely Huelgos"
            />
            <Field
              label="Cargo"
              value={form.job_title}
              onChange={(v) => setField("job_title", v)}
              error={errors['job_title']}
              placeholder="Ej. Senior UX Designer"
            />
            <Field
              label="Área"
              value={form.area}
              onChange={(v) => setField("area", v)}
              error={errors['area']}
              placeholder="Ej. Design"
            />
            <Field
              label="Líder / responsable directo"
              value={form.leader_name}
              onChange={(v) => setField("leader_name", v)}
              error={errors['leader_name']}
              placeholder="Ej. Ana Martínez"
            />
            <Field
              label="Periodo a evaluar"
              value={form.evaluation_period}
              onChange={(v) => setField("evaluation_period", v)}
              error={errors['evaluation_period']}
              placeholder="Ej. Q3 2026"
            />
          </div>
          <div className="mt-5 space-y-1.5">
            <Label htmlFor="responsibilities">Responsabilidades generales</Label>
            <Textarea
              id="responsibilities"
              rows={6}
              value={form.general_responsibilities}
              onChange={(e) => setField("general_responsibilities", e.target.value)}
              placeholder="Describe las responsabilidades principales asociadas al rol."
            />
          </div>
        </Panel>

        <Panel
          title="Indicadores"
          description="Define los indicadores con los que se evaluará el rol."
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIndicators((prev) => [...prev, { ...emptyIndicator }])}
            >
              <Plus className="size-4" />
              Añadir indicador
            </Button>
          }
        >
          <div className="space-y-5">
            {indicators.map((indicator, index) => (
              <div key={index} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Indicador {index + 1}
                  </p>
                  {indicators.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIndicators((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Nombre"
                    value={indicator.name}
                    onChange={(v) => updateIndicator(index, "name", v)}
                    error={errors[`indicator-${index}-name`]}
                    placeholder="Cumplimiento de entregas"
                  />
                  <Field
                    label="Descripción"
                    value={indicator.description}
                    onChange={(v) => updateIndicator(index, "description", v)}
                    placeholder="Entregables realizados dentro del plazo acordado"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Meta"
                      value={indicator.target_value}
                      onChange={(v) => updateIndicator(index, "target_value", v)}
                      error={errors[`indicator-${index}-target_value`]}
                      placeholder="95"
                    />
                    <Field
                      label="Resultado actual"
                      value={indicator.current_value}
                      onChange={(v) => updateIndicator(index, "current_value", v)}
                      error={errors[`indicator-${index}-current_value`]}
                      placeholder="88"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Unidad"
                      value={indicator.unit}
                      onChange={(v) => updateIndicator(index, "unit", v)}
                      placeholder="%"
                    />
                    <Field
                      label="Peso (opcional)"
                      value={indicator.weight}
                      onChange={(v) => updateIndicator(index, "weight", v)}
                      error={errors[`indicator-${index}-weight`]}
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/personas" })}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar persona"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  placeholder?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
