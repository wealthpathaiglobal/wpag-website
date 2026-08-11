import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapResearchControlsStatus, ResearchControlsRepositoryError } from "@/lib/repositories/admin/admin-research-controls-repository";
import type { ResearchControlsStatus, WithdrawalRequestInput } from "@/lib/types/research/research-controls";

type StatusRow = Parameters<typeof mapResearchControlsStatus>[0];
type WithdrawalRow = { withdrawal_id: string; withdrawal_status: string; consent_gate: string; collection_authorized: boolean };

function fail(error: { code?: string; message?: string }): never {
  throw new ResearchControlsRepositoryError(
    error.code === "P1001" && error.message?.includes("not authorized")
      ? "unauthorized"
      : error.code === "P1001"
        ? "invalid"
        : "unexpected",
  );
}

export class ParticipantResearchControlsRepository {
  async getStatus(participantId: string, actorUserId: string): Promise<ResearchControlsStatus | null> {
    const { data, error } = await supabaseAdmin.rpc("get_research_controls_status", {
      p_participant_id: participantId, p_actor_user_id: actorUserId, p_required_family: "FSH",
    });
    if (error) fail(error);
    const row = ((data ?? []) as StatusRow[])[0];
    return row ? mapResearchControlsStatus(row) : null;
  }

  async requestWithdrawal(input: WithdrawalRequestInput) {
    const { data, error } = await supabaseAdmin.rpc("request_research_withdrawal", {
      p_enrollment_id: input.enrollmentId,
      p_actor_user_id: input.actorUserId,
      p_asserted_scope: input.assertedScope,
      p_request_channel: input.requestChannel,
      p_reason: input.reason ?? null,
      p_correlation_id: input.correlationId,
    });
    if (error) fail(error);
    const row = ((data ?? []) as WithdrawalRow[])[0];
    if (!row || row.withdrawal_status !== "REQUESTED" || row.consent_gate !== "BLOCKED" || row.collection_authorized !== false) {
      throw new ResearchControlsRepositoryError("unexpected");
    }
    return { withdrawalId: row.withdrawal_id, withdrawalStatus: "REQUESTED" as const, consentGate: "BLOCKED" as const, collectionAuthorized: false as const };
  }
}

export const participantResearchControlsRepository = new ParticipantResearchControlsRepository();
