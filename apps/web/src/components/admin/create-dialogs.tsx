import { useMutation, useQuery } from "@tanstack/react-query";
import { federationYear } from "@fsx/api/lib/dates";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { CircuitType, CompetitionTier } from "@fsx/api/circuit-types";

import { EntityFormDialog, optional, optionalNumber, type EntitySection } from "@/components/admin/entity-form";
import { EventForm } from "@/components/admin/event-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { PlayerForm } from "@/components/admin/player-form";
import { PostForm } from "@/components/admin/post-form";
import { TvSergipeForm, toTvSergipeInput } from "@/components/admin/tv-sergipe-form";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation, useInvalidateAdmin } from "@/lib/admin-mutations";
import {
  LINK_GROUP_SECTIONS,
  announcementSections,
  circuitSections,
  tournamentPodiumSections,
  tournamentSections,
} from "@/lib/admin-forms";
import { showMutationError } from "@/lib/errors";
import { parseCategoryList, useCategoryOptions, useScoringSchemeOptions } from "@/lib/reference-options";
import { scheduleToInstant } from "@/lib/schedule";
import { useTRPC } from "@/lib/trpc";

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fieldsOf = (sections: EntitySection[]) => sections.flatMap((section) => section.fields);

export function PlayerCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();
  const { data: locations = [] } = useQuery(trpc.locations.list.queryOptions());

  const createMutation = useAdminMutation(trpc.players.create.mutationOptions(), {
    invalidates: "players",
    success: "Player created",
    failure: "Failed to create player",
    onSuccess: async () => {
      await commit();
      onOpenChange(false);
    },
    onError: (_error, variables) => discard(variables.imageUrl),
  });

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="New player" description="Register a player with the federation.">
      <PlayerForm
        defaultValues={{
          name: "",
          nickname: "",
          birthYear: "",
          sex: "male",
          imageUrl: "",
          clubId: null,
          locationId: null,
          classic: 1900,
          rapid: 1900,
          blitz: 1900,
          cbxId: null,
          fideId: null,
          active: true,
          verified: false,
        }}
        onSubmit={(values) =>
          createMutation.mutate({
            ...values,
            nickname: values.nickname || null,
            birthYear: values.birthYear ? Number(values.birthYear) : null,
            imageUrl: values.imageUrl || null,
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create player"
        locations={locations}
        onImageReplaced={trackReplaced}
        onImageUploaded={trackCreated}
      />
    </FormDialog>
  );
}

export function PostCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();

  const createMutation = useAdminMutation(trpc.posts.create.mutationOptions(), {
    invalidates: "posts",
    awaitInvalidation: true,
    success: "Post created",
    failure: "Failed to create post",
    onSuccess: async () => {
      await commit();
      onOpenChange(false);
    },
    onError: (_error, variables) => discard(variables.imageUrl),
  });

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="New post" description="Write a news article.">
      <PostForm
        defaultValues={{ title: "", slug: "", imageUrl: "", content: "", published: false, publishAt: "" }}
        onSubmit={(values) =>
          createMutation.mutate({ ...values, imageUrl: values.imageUrl || null, publishAt: scheduleToInstant(values.publishAt) })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create post"
        onImageReplaced={trackReplaced}
        onImageUploaded={trackCreated}
      />
    </FormDialog>
  );
}

export function EventCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();
  const createMutation = useMutation(trpc.events.create.mutationOptions());
  const setLinksMutation = useMutation(trpc.events.setLinks.mutationOptions());

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="New event" description="Add an upcoming event and its links.">
      <EventForm
        defaultValues={{ name: "", startDate: "", endDate: "", venue: "", venueUrl: "", tournamentId: "", links: [] }}
        error={createMutation.error ?? setLinksMutation.error}
        submitLabel="Create event"
        onSubmit={async ({ name, startDate, endDate, venue, venueUrl, tournamentId, links }) => {
          let createdId: number | undefined;
          try {
            const [created] = await createMutation.mutateAsync({
              name,
              startDate,
              endDate: endDate || null,
              venue: venue.trim() || null,
              venueUrl: venueUrl.trim() || null,
              tournamentId: tournamentId ? Number(tournamentId) : null,
            });
            createdId = created?.id;
            if (created && links.length > 0) await setLinksMutation.mutateAsync({ eventId: created.id, links });
            void invalidateAdmin("events");
            toast.success("Event created");
            onOpenChange(false);
          } catch (error) {
            if (createdId === undefined) {
              showMutationError(error, "Failed to create event");
              return;
            }
            void invalidateAdmin("events");
            showMutationError(error, "Event created, but its links were not saved");
            onOpenChange(false);
            await navigate({ to: "/dashboard/events/$id", params: { id: createdId } });
          }
        }}
      />
    </FormDialog>
  );
}

export function TvSergipeCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const createMutation = useAdminMutation(trpc.tvSergipe.create.mutationOptions(), {
    invalidates: "tvSergipe",
    success: "Result created",
    failure: "Failed to create result",
    onSuccess: () => onOpenChange(false),
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New result"
      description="Record a placement in the TV Sergipe School Games."
    >
      <TvSergipeForm
        defaultValues={{
          tournamentId: "",
          clubId: "",
          modality: "individual",
          playerId: "",
          teamName: "A",
          ageGroup: "8",
          sex: "male",
          place: "1",
          points: "",
        }}
        onSubmit={(values) => createMutation.mutate(toTvSergipeInput(values))}
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create result"
      />
    </FormDialog>
  );
}

export function LinkGroupCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const createMutation = useAdminMutation(trpc.links.create.mutationOptions(), {
    invalidates: "links",
    awaitInvalidation: true,
    success: "Group created. Add its links below.",
    failure: "Failed to create group",
    onSuccess: (created) => {
      onOpenChange(false);
      const id = created[0]?.id;
      return id ? navigate({ to: "/dashboard/links/$id", params: { id } }) : undefined;
    },
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New link group"
      description="Name the group first; you add its links on the next page."
      fields={fieldsOf(LINK_GROUP_SECTIONS)}
      defaultValues={{ label: "" }}
      onSubmit={(values) => createMutation.mutate({ label: values.label! })}
      error={createMutation.error}
      pending={createMutation.isPending}
      submitLabel="Create group"
    />
  );
}

export function CircuitCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: championships = [] } = useQuery(trpc.champions.list.queryOptions());
  const schemes = useScoringSchemeOptions();
  const categoryOptions = useCategoryOptions();
  const createMutation = useAdminMutation(trpc.circuits.create.mutationOptions(), {
    invalidates: "circuits",
    awaitInvalidation: true,
    success: "Circuit created. Add its stages below.",
    failure: "Failed to create circuit",
    onSuccess: (created) => {
      onOpenChange(false);
      const id = created[0]?.id;
      return id ? navigate({ to: "/dashboard/circuits/$id", params: { id } }) : undefined;
    },
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New circuit"
      description="Create one circuit per season; you add its stages and points on the next page."
      fields={fieldsOf(circuitSections(championships, schemes, categoryOptions))}
      defaultValues={{
        name: "",
        year: String(federationYear()),
        type: "default",
        tier: "B",
        championshipId: "",
        scoringSchemeId: "",
        categories: "[]",
      }}
      onSubmit={(values) =>
        createMutation.mutate({
          name: values.name!,
          year: Number(values.year),
          type: values.type as CircuitType,
          tier: values.tier as CompetitionTier,
          championshipId: optionalNumber(values.championshipId!),
          scoringSchemeId: optionalNumber(values.scoringSchemeId!),
          categories: parseCategoryList(values.categories),
        })
      }
      error={createMutation.error}
      pending={createMutation.isPending}
      submitLabel="Create circuit"
    />
  );
}

export function AnnouncementCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: announcements = [] } = useQuery(trpc.announcements.list.queryOptions());
  const year = federationYear();
  const nextNumber =
    announcements.filter((announcement) => announcement.year === year).reduce((max, a) => Math.max(max, a.number), 0) + 1;

  const createMutation = useAdminMutation(trpc.announcements.create.mutationOptions(), {
    invalidates: "announcements",
    awaitInvalidation: true,
    success: "Announcement created",
    failure: "Failed to create announcement",
    onSuccess: (created) => {
      onOpenChange(false);
      const announcement = created[0];
      return announcement && announcement.playerId === null
        ? navigate({ to: "/dashboard/announcements/$id", params: { id: announcement.id } })
        : undefined;
    },
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New announcement"
      description="The next number for this year is filled in for you."
      fields={fieldsOf(announcementSections(trpc))}
      defaultValues={{ year: String(year), number: String(nextNumber), content: "", playerId: "" }}
      onSubmit={(values) =>
        createMutation.mutate({
          year: Number(values.year),
          number: Number(values.number),
          content: values.content!,
          playerId: optionalNumber(values.playerId!),
        })
      }
      error={createMutation.error}
      pending={createMutation.isPending}
      submitLabel="Create announcement"
    />
  );
}

export function TournamentCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const { data: championships = [] } = useQuery(trpc.champions.list.queryOptions());
  const schemes = useScoringSchemeOptions();
  const createMutation = useAdminMutation(trpc.tournaments.create.mutationOptions(), {
    invalidates: "tournaments",
    success: "Tournament created",
    failure: "Failed to create tournament",
    onSuccess: () => onOpenChange(false),
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New tournament"
      description="Create the tournament before importing its rating results or podiums."
      fields={fieldsOf(tournamentSections(championships, schemes))}
      defaultValues={{ name: "", date: "", ratingType: "rapid", tier: "B", hasPodiums: "true", championshipId: "", chessResults: "", scoringSchemeId: "" }}
      onSubmit={(values) =>
        createMutation.mutate({
          name: values.name!,
          date: optional(values.date!),
          ratingType: values.ratingType as "blitz" | "rapid" | "classic",
          tier: values.tier as CompetitionTier,
          hasPodiums: values.hasPodiums !== "false",
          championshipId: optionalNumber(values.championshipId!),
          chessResults: optional(values.chessResults!),
          scoringSchemeId: optionalNumber(values.scoringSchemeId!),
        })
      }
      error={createMutation.error}
      pending={createMutation.isPending}
      submitLabel="Create tournament"
    />
  );
}

export function PodiumCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const trpc = useTRPC();
  const categoryOptions = useCategoryOptions();
  const createMutation = useAdminMutation(trpc.tournamentPodiums.create.mutationOptions(), {
    invalidates: "tournamentPodiums",
    success: "Podium created",
    failure: "Failed to create podium",
    onSuccess: () => onOpenChange(false),
  });

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New podium"
      description="Record a player's final place in a tournament."
      fields={fieldsOf(tournamentPodiumSections(trpc, categoryOptions))}
      defaultValues={{ tournamentId: "", playerId: "", place: "1", category: "" }}
      onSubmit={(values) =>
        createMutation.mutate({
          tournamentId: Number(values.tournamentId),
          playerId: Number(values.playerId),
          place: Number(values.place),
          category: values.category || null,
        })
      }
      error={createMutation.error}
      pending={createMutation.isPending}
      submitLabel="Create podium"
    />
  );
}
