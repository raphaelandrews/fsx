import { lazy, Suspense, useEffect, useState, type DragEvent, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CheckmarkBadge01Icon, Edit02Icon, Image01Icon, ImageUploadIcon, User02Icon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { Button, buttonVariants } from "@fsx/ui/components/button";
import { Checkbox } from "@fsx/ui/components/checkbox";
import { Skeleton } from "@fsx/ui/components/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@fsx/ui/components/select";
import { cn } from "@fsx/ui/lib/utils";
import { federationYear } from "@fsx/api/lib/dates";

import { DigitsInput } from "@/components/form/digits-input";
import { InlineAlert } from "@/components/admin/inline-alert";
import { FormField } from "@/components/form/form-field";
import { SearchableSelect } from "@/components/form/searchable-select";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/player/turnstile";
import { getErrorCode, getServerMessage, getUserErrorMessage } from "@/lib/errors";
import { blobToPhoto, PHOTO_ACCEPT, PHOTO_OUTPUT_WIDTH, readPhotoFile, type PreparedPhoto } from "@/lib/photo-upload";
import { useTRPC } from "@/lib/trpc";

// react-image-crop is only needed once a photo is chosen.
const ImageCropper = lazy(() => import("@/components/media/image-cropper").then((module) => ({ default: module.ImageCropper })));

const CROPPER_LABELS = {
  cancel: "Cancelar",
  apply: "Usar esta foto",
  processing: "Preparando…",
  previewFailed: "Não foi possível mostrar esta foto",
  previewFailedHint: "O arquivo pode estar em um formato que o navegador não abre (por exemplo HEIC). Tente outra foto.",
};

const KEEP = "keep";
// Players represent a city of Sergipe in state events, a state nationally, and a country abroad.
const LOCATION_GROUPS = [
  { type: "city", label: "Cidades de Sergipe" },
  { type: "state", label: "Estados" },
  { type: "country", label: "Países" },
] as const;

type Values = Record<"playerId" | "birthYear" | "clubId" | "locationId" | "cbxId" | "fideId" | "website", string>;
const EMPTY: Values = { playerId: "", birthYear: "", clubId: "", locationId: "", cbxId: "", fideId: "", website: "" };
type Errors = Partial<Record<keyof Values | "form" | "consent", string>>;

function validate(values: Values, hasPhoto: boolean, consent: boolean): Errors {
  const errors: Errors = {};
  if (!values.playerId) errors.playerId = "Escolha o jogador.";
  const year = values.birthYear.trim();
  if (year && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > federationYear())) {
    errors.birthYear = `Use quatro dígitos, entre 1900 e ${federationYear()}.`;
  }
  for (const key of ["cbxId", "fideId"] as const) {
    const value = values[key].trim();
    if (value && !/^[1-9]\d{0,9}$/.test(value)) errors[key] = "Use só números.";
  }
  const changes = [values.birthYear, values.clubId, values.locationId, values.cbxId, values.fideId].filter((value) => value.trim()).length + (hasPhoto ? 1 : 0);
  if (values.playerId && changes === 0) errors.form = "Preencha pelo menos um dado ou envie uma foto.";
  if (!consent) errors.consent = "Confirme que as informações são verdadeiras para enviar.";
  return errors;
}

// The server writes these messages in Portuguese for this form; anything else uses the site's own wording.
function failureMessage(error: unknown) {
  const code = getErrorCode(error);
  const server = getServerMessage(error);
  return (code === "CONFLICT" || code === "TOO_MANY_REQUESTS" || code === "BAD_REQUEST") && server
    ? server
    : getUserErrorMessage(error, "Não foi possível enviar. Confira os dados e tente novamente.");
}

const STEPS = [
  { key: "jogador", icon: User02Icon, title: "Nome do jogador", description: "Busque pelo nome. Se você é responsável por um menor, escolha o menor." },
  { key: "dados", icon: Edit02Icon, title: "Dados", description: "Preencha só o que quer corrigir ou completar; o resto fica como está." },
  { key: "foto", icon: Image01Icon, title: "Foto", description: "Opcional. Você recorta a foto antes de enviar; só a FSX a vê até aprovar." },
] as const;

/** A full-page, three-step form: player, data, photo. Nothing is saved until the last step is sent. */
export function UpdateRequestForm() {
  const trpc = useTRPC();
  const { data: locations } = useSuspenseQuery(trpc.locations.list.queryOptions());
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<{ playerId: string; summary: string[] } | null>(null);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // A challenge token is single use, so every attempt remounts the widget for a fresh one.
  const [challenge, setChallenge] = useState({ token: "", attempt: 0 });
  const submit = useMutation(trpc.playerRequests.submit.mutationOptions());

  // What the profile shows today, so the visitor sees what they are changing.
  const current = useQuery({ ...trpc.players.byId.queryOptions({ id: Number(values.playerId) || 1 }), enabled: values.playerId !== "" });
  const currentPlayer = values.playerId ? current.data : undefined;

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  const set = (key: keyof Values) => (value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined, form: undefined }));
  };
  // Shows a field's problem as soon as the visitor leaves it, not only when continuing.
  const check = (key: "birthYear" | "cbxId" | "fideId") => setErrors((previous) => ({ ...previous, [key]: validate(values, photo !== null, true)[key] }));

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    try {
      setCropSource(await readPhotoFile(file));
    } catch (failure) {
      setPhotoError(failure instanceof Error ? failure.message : "Não foi possível usar esta foto.");
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void choosePhoto(event.dataTransfer.files[0]);
  };

  const locationName = (id: string) => locations.find((location) => String(location.id) === id)?.name;
  const changes = [values.birthYear, values.clubId, values.locationId, values.cbxId, values.fideId].filter((value) => value.trim()).length + (photo ? 1 : 0);

  function onNext() {
    const found = validate(values, photo !== null, true);
    const relevant: Errors = step === 0 ? { playerId: found.playerId } : { birthYear: found.birthYear, cbxId: found.cbxId, fideId: found.fideId };
    setErrors(relevant);
    if (Object.values(relevant).some(Boolean)) return;
    setStep((previous) => previous + 1);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (step < STEPS.length - 1) return onNext();

    const found = validate(values, photo !== null, consent);
    if (TURNSTILE_SITE_KEY && !challenge.token && Object.keys(found).length === 0) {
      found.form = "Aguarde a verificação de segurança terminar e envie de novo.";
    }
    setErrors(found);
    // A problem in an earlier step sends the visitor back to it.
    if (found.playerId) return setStep(0);
    if (found.birthYear || found.cbxId || found.fideId) return setStep(1);
    if (Object.keys(found).length > 0) return;

    const number = (value: string) => (value.trim() ? Number(value) : undefined);
    const summary = [
      values.birthYear.trim() && `Ano de nascimento: ${values.birthYear.trim()}`,
      values.clubId && "Clube",
      values.locationId && `Local: ${locationName(values.locationId) ?? ""}`,
      values.cbxId.trim() && `ID CBX: ${values.cbxId.trim()}`,
      values.fideId.trim() && `ID FIDE: ${values.fideId.trim()}`,
      photo && "Foto",
    ].filter((line): line is string => Boolean(line));

    submit.mutate(
      {
        playerId: Number(values.playerId),
        birthYear: number(values.birthYear),
        clubId: number(values.clubId),
        locationId: number(values.locationId),
        cbxId: number(values.cbxId),
        fideId: number(values.fideId),
        photo: photo ? { mime: photo.mime, data: photo.data } : undefined,
        consent: true,
        website: values.website,
        turnstileToken: challenge.token || undefined,
      },
      {
        onSuccess: () => setSent({ playerId: values.playerId, summary }),
        onSettled: () => setChallenge((previous) => ({ token: "", attempt: previous.attempt + 1 })),
      },
    );
  }

  const serverError = submit.error ? failureMessage(submit.error) : null;
  const heading = STEPS[step]!;

  if (sent) {
    return (
      <main className="relative flex min-h-dvh flex-col px-5 pt-8 pb-16" data-testid="update-request-success">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        />
        <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col items-center sm:justify-center sm:gap-12">
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center sm:flex-none">
            <span className="mb-2 flex size-18 items-center justify-center rounded-full bg-muted lg:size-24">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-8 lg:size-10" aria-hidden />
            </span>
            <h1 className="w-full text-pretty font-bold text-xl tracking-[-0.03em] lg:text-2xl">Solicitação enviada!</h1>
            <p className="text-pretty text-muted-foreground">A FSX vai conferir e atualizar o perfil. Você não precisa enviar de novo.</p>
            <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
              {sent.summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="flex w-full items-center gap-4">
            <Button
              variant="secondary"
              size="pill"
              className="w-full"
              onClick={() => {
                setValues(EMPTY);
                setConsent(false);
                setPhoto(null);
                setStep(0);
                setSent(null);
                submit.reset();
              }}
            >
              Enviar outra
            </Button>
            <Link to="/jogadores/$id" params={{ id: Number(sent.playerId) }} className={cn(buttonVariants({ size: "pill" }), "w-full")}>
              Ver o perfil
            </Link>
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="relative flex min-h-dvh flex-col px-5 pt-8 pb-8">
      {/* A faint dot grid that fades out downwards; decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
      />
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <ol className="flex items-center gap-2 py-3" aria-label={`Passo ${step + 1} de ${STEPS.length}`}>
            {STEPS.map((item, index) => (
              <li key={item.key} className={cn("h-2 rounded-full transition-[width,background-color] duration-200", index === step ? "w-8 bg-primary" : index < step ? "w-2 bg-primary/40" : "w-2 bg-border")} />
            ))}
          </ol>
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={heading.icon} className="size-6" aria-hidden />
          </span>
          <p className="text-muted-foreground text-sm">Atualizar cadastro</p>
          <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">{heading.title}</h1>
          <p className="max-w-md text-muted-foreground text-sm">{heading.description}</p>
        </div>

          <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col justify-between gap-8">
            <div key={step} className="fade-in-0 animate-in space-y-5 duration-200">
              {step === 0 ? (
                <>
                  <FormField label="Jogador(a)" htmlFor="request-player" required error={errors.playerId}>
                    <SearchableSelect
                      id="request-player"
                      value={values.playerId}
                      onChange={set("playerId")}
                      getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
                      placeholder="Busque pelo nome..."
                      emptyText="Nenhum jogador encontrado."
                    />
                  </FormField>
                  {values.playerId ? (
                    <div className="flex min-h-[5.5rem] items-center gap-3 text-sm">
                      <Avatar className="size-12">
                        <AvatarImage alt="" src={currentPlayer?.imageUrl ?? undefined} />
                        <AvatarFallback className="bg-warning" />
                      </Avatar>
                      {currentPlayer ? (
                        <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-3 text-muted-foreground">
                          <dt>Clube</dt>
                          <dd className="truncate text-foreground">{currentPlayer.club?.name ?? "—"}</dd>
                          <dt>Local</dt>
                          <dd className="truncate text-foreground">{currentPlayer.location?.name ?? "—"}</dd>
                          <dt>CBX · FIDE</dt>
                          <dd className="text-foreground tabular-nums">
                            {currentPlayer.cbxId ?? "—"} · {currentPlayer.fideId ?? "—"}
                          </dd>
                        </dl>
                      ) : (
                        <div className="grid flex-1 gap-2" aria-busy="true">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <FormField label="Ano de nascimento" htmlFor="request-birth" hint="Só o ano é guardado." error={errors.birthYear}>
                    <DigitsInput id="request-birth" maxLength={4} placeholder="2012" value={values.birthYear} onValueChange={set("birthYear")} onBlur={() => check("birthYear")} />
                  </FormField>
                  <FormField label="Clube" htmlFor="request-club">
                    <SearchableSelect
                      id="request-club"
                      value={values.clubId}
                      onChange={set("clubId")}
                      getQueryOptions={(query) => trpc.clubs.search.queryOptions({ query })}
                      placeholder="Busque o clube..."
                      emptyText="Nenhum clube encontrado."
                    />
                  </FormField>
                  <FormField label="Local que representa" htmlFor="request-location" hint="Cidade de Sergipe, estado ou país, conforme o torneio em que joga.">
                    <Select value={values.locationId || KEEP} onValueChange={(next) => next && set("locationId")(next === KEEP ? "" : next)}>
                      <SelectTrigger id="request-location" size="lg" className="w-full">
                        <SelectValue>{(chosen) => (chosen === KEEP || !chosen ? "Manter o atual" : (locationName(String(chosen)) ?? "Manter o atual"))}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={KEEP}>Manter o atual</SelectItem>
                        {LOCATION_GROUPS.map((group) => {
                          const options = locations.filter((location) => location.type === group.type);
                          return options.length > 0 ? (
                            <SelectGroup key={group.type}>
                              <SelectLabel>{group.label}</SelectLabel>
                              {options.map((location) => (
                                <SelectItem key={location.id} value={String(location.id)}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="ID CBX" htmlFor="request-cbx" error={errors.cbxId}>
                      <DigitsInput id="request-cbx" maxLength={10} value={values.cbxId} onValueChange={set("cbxId")} onBlur={() => check("cbxId")} />
                    </FormField>
                    <FormField label="ID FIDE" htmlFor="request-fide" error={errors.fideId}>
                      <DigitsInput id="request-fide" maxLength={10} value={values.fideId} onValueChange={set("fideId")} onBlur={() => check("fideId")} />
                    </FormField>
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="space-y-2">
                    {photo ? (
                      <div className="flex items-center gap-4 rounded-2xl border p-3">
                        <Avatar className="size-20">
                          <AvatarImage alt="Pré-visualização da foto" src={photo.previewUrl} />
                          <AvatarFallback />
                        </Avatar>
                        <div className="flex flex-wrap gap-2">
                          <label htmlFor="request-photo" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "cursor-pointer has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50")}>
                            Trocar foto
                            <input id="request-photo" type="file" accept={PHOTO_ACCEPT} className="sr-only" onChange={(event) => { void choosePhoto(event.target.files?.[0]); event.target.value = ""; }} />
                          </label>
                          <Button type="button" variant="ghost" size="lg" onClick={() => setPhoto(null)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="request-photo"
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        className={cn(
                          "flex w-full cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed p-6 text-center transition-colors duration-150 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                          dragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-primary/5",
                        )}
                      >
                        <HugeiconsIcon icon={ImageUploadIcon} className="mb-1 size-10 text-muted-foreground" aria-hidden />
                        <span className="font-semibold text-base">Clique para escolher a foto ou arraste o arquivo</span>
                        <span className="text-muted-foreground text-sm">JPG, PNG ou WebP. Você recorta antes de enviar.</span>
                        <input id="request-photo" type="file" accept={PHOTO_ACCEPT} className="sr-only" onChange={(event) => { void choosePhoto(event.target.files?.[0]); event.target.value = ""; }} />
                      </label>
                    )}
                    {photoError ? (
                      <p className="text-destructive text-sm" role="alert">
                        {photoError}
                      </p>
                    ) : null}
                  </div>

                  {/* Honeypot: invisible to people, tempting to bots. */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                    value={values.website}
                    onChange={(event) => set("website")(event.target.value)}
                  />

                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={consent}
                      onCheckedChange={(checked) => {
                        setConsent(checked === true);
                        setErrors((previous) => ({ ...previous, consent: undefined }));
                      }}
                      className="mt-0.5"
                    />
                    <span className="text-pretty">
                      Confirmo que as informações são verdadeiras e, se o jogador for menor de idade, que sou o responsável. Os dados ficam visíveis apenas para a administração da FSX.
                    </span>
                  </label>
                  {errors.consent ? (
                    <p className="text-destructive text-sm" role="alert">
                      {errors.consent}
                    </p>
                  ) : null}

                  {TURNSTILE_SITE_KEY ? (
                    <Turnstile key={challenge.attempt} siteKey={TURNSTILE_SITE_KEY} onToken={(token) => setChallenge((previous) => ({ ...previous, token }))} />
                  ) : null}

                  {errors.form || serverError ? (
                    <InlineAlert tone="error" title="Não foi possível enviar">
                      {errors.form ?? serverError}
                    </InlineAlert>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              {step === 0 ? (
                <Link to="/" className={cn(buttonVariants({ variant: "secondary", size: "pill" }), "w-full")}>
                  Cancelar
                </Link>
              ) : (
                <Button type="button" variant="secondary" size="pill" className="w-full" onClick={() => setStep((previous) => previous - 1)}>
                  Voltar
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="submit" size="pill" className="w-full">
                  Continuar
                  <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" aria-hidden />
                </Button>
              ) : (
                <Button type="submit" size="pill" className="w-full" loading={submit.isPending}>
                  {changes > 0 ? `Enviar ${changes} ${changes === 1 ? "alteração" : "alterações"}` : "Enviar para análise"}
                </Button>
              )}
            </div>
          </form>
      </div>

      {cropSource ? (
        <Suspense fallback={null}>
          <ImageCropper
            imageSrc={cropSource}
            open
            onOpenChange={(open) => !open && setCropSource(null)}
            onCropComplete={async (blob) => {
              setCropSource(null);
              try {
                setPhoto(await blobToPhoto(blob));
              } catch {
                setPhotoError("Não foi possível preparar a foto. Tente outra.");
              }
            }}
            aspectRatio={1}
            outputWidth={PHOTO_OUTPUT_WIDTH}
            title="Recortar a foto"
            description="Ajuste o quadrado para enquadrar o rosto. É assim que a foto aparece no perfil."
            labels={CROPPER_LABELS}
          />
        </Suspense>
      ) : null}
    </main>
  );
}
