import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapResearchControlsStatus, ResearchControlsRepositoryError } from "@/lib/repositories/admin/admin-research-controls-repository";
import { participantRequestStatuses, participantRequestTypes, type ParticipantResearchRequest, type ParticipantRequestType, type ResearchControlsStatus, type WithdrawalRequestInput } from "@/lib/types/research/research-controls";

type StatusRow = Parameters<typeof mapResearchControlsStatus>[0];
type WithdrawalRow = { withdrawal_id: string; withdrawal_status: string; consent_gate: string; collection_authorized: boolean };
type RequestRow = { request_event_id: string; request_type: string; request_status: string; submitted_at: string };

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

  async listRequests(participantId: string, actorUserId: string): Promise<ParticipantResearchRequest[]> {
    const { data, error } = await supabaseAdmin.rpc("list_participant_research_requests", { p_participant_id: participantId, p_actor_user_id: actorUserId });
    if (error) fail(error);
    return ((data ?? []) as RequestRow[]).map((row) => {
      if (!participantRequestTypes.includes(row.request_type as never) || !participantRequestStatuses.includes(row.request_status as never)) throw new ResearchControlsRepositoryError("unexpected");
      return { requestEventId: row.request_event_id, requestType: row.request_type as ParticipantRequestType, requestStatus: row.request_status as ParticipantResearchRequest["requestStatus"], submittedAt: row.submitted_at };
    });
  }

  async submitRequest(input: { enrollmentId: string; actorUserId: string; requestType: ParticipantRequestType; details: string; correlationId: string }) {
    const { data, error } = await supabaseAdmin.rpc("submit_research_participant_request", {
      p_enrollment_id: input.enrollmentId, p_actor_user_id: input.actorUserId, p_request_type: input.requestType, p_details: input.details, p_correlation_id: input.correlationId,
    });
    if (error) fail(error);
    const row = ((data ?? []) as Array<{ request_event_id: string; request_status: string; routing_class: string }>)[0];
    if (!row || row.request_status !== "RECEIVED") throw new ResearchControlsRepositoryError("unexpected");
    return { requestEventId: row.request_event_id, requestStatus: "RECEIVED" as const };
  }
}

export const participantResearchControlsRepository = new ParticipantResearchControlsRepository();
