import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { getCurrentParticipantRecord, ParticipantResolutionError } from "./participant-repository";

describe("participant self resolution repository", () => {
  beforeEach(() => {
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({ data: [], error: null });
  });

  it("calls only the governed self-resolution RPC", async () => {
    await getCurrentParticipantRecord();
    expect(mocks.rpc).toHaveBeenCalledWith("get_current_participant");
  });

  it("returns the narrow linked participant row", async () => {
    const row = { participant_id: "participant-id", participant_code: "WPAG-1", lifecycle_status: "active", research_status: "enrolled", enrollment_date: null, profile_completed: false };
    mocks.rpc.mockResolvedValue({ data: [row], error: null });
    await expect(getCurrentParticipantRecord()).resolves.toEqual(row);
  });

  it("returns null for an authenticated nonparticipant", async () => {
    await expect(getCurrentParticipantRecord()).resolves.toBeNull();
  });

  it("suppresses raw database diagnostics", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "sensitive database detail" } });
    await expect(getCurrentParticipantRecord()).rejects.toEqual(new ParticipantResolutionError());
  });
});
