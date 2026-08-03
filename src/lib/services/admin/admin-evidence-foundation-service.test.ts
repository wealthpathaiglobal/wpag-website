import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", async () => ({ supabaseAdmin: (await import("@/test/mocks/supabase-admin")).supabaseAdminMock }));

import { AdminEvidenceFoundationService } from "./admin-evidence-foundation-service";
import { AdminEvidenceFoundationRepositoryError } from "@/lib/repositories/admin/admin-evidence-foundation-repository";

const actorId = "10000000-0000-4000-8000-000000000001";
const participantId = "20000000-0000-4000-8000-000000000001";
const assessmentId = "30000000-0000-4000-8000-000000000001";
const documentId = "40000000-0000-4000-8000-000000000001";

describe("AdminEvidenceFoundationService", () => {
  const repository = { list: vi.fn(), get: vi.fn() };
  beforeEach(() => { vi.resetAllMocks(); repository.list.mockResolvedValue([]); repository.get.mockResolvedValue({ documentId }); });
  const service = () => new AdminEvidenceFoundationService(repository as never);

  it("validates and forwards admin filters", async () => {
    await service().list(actorId, { participantId, assessmentId });
    expect(repository.list).toHaveBeenCalledWith(actorId, participantId, assessmentId);
  });

  it("rejects malformed identities before repository access", async () => {
    await expect(service().list("bad")).rejects.toMatchObject({ kind: "invalid" });
    await expect(service().get("bad", actorId)).rejects.toMatchObject({ kind: "invalid" });
    expect(repository.list).not.toHaveBeenCalled();
  });

  it("maps missing evidence without leaking diagnostics", async () => {
    repository.get.mockResolvedValue(null);
    await expect(service().get(documentId, actorId)).rejects.toMatchObject({ kind: "not_found", message: "Evidence was not found." });
  });

  it("maps database authorization failure safely", async () => {
    repository.list.mockRejectedValue(new AdminEvidenceFoundationRepositoryError("list", "unauthorized"));
    await expect(service().list(actorId)).rejects.toMatchObject({ kind: "unauthorized", message: "Evidence operation could not be completed." });
  });
});
