import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertEnvironment: vi.fn(),
  bootstrap: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/auth/participant-b-credential-bootstrap", () => ({
  assertParticipantBBootstrapEnvironment: mocks.assertEnvironment,
  bootstrapParticipantBPassword: mocks.bootstrap,
}));

import { AuthorizationError } from "@/lib/auth/errors";
import { POST } from "./route";

const request = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/staging/participant-b-credential-bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("Participant B credential bootstrap route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireRole.mockResolvedValue({ auth_user_id: "administrator" });
    mocks.bootstrap.mockResolvedValue(undefined);
  });

  it("fails before body parsing outside the controlled staging environment", async () => {
    mocks.assertEnvironment.mockImplementation(() => {
      throw new Error("unavailable");
    });
    const json = vi.fn();
    const response = await POST({ json } as never);
    expect(response.status).toBe(503);
    expect(json).not.toHaveBeenCalled();
    expect(mocks.requireRole).not.toHaveBeenCalled();
    expect(mocks.bootstrap).not.toHaveBeenCalled();
  });

  it("requires administrator authorization before reading the secret", async () => {
    mocks.requireRole.mockRejectedValue(new AuthorizationError());
    const json = vi.fn();
    const response = await POST({ json } as never);
    expect(response.status).toBe(403);
    expect(json).not.toHaveBeenCalled();
    expect(mocks.bootstrap).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation and rejects unsupported identity fields", async () => {
    expect((await POST(request({ password: "a".repeat(16), confirmed: false }))).status).toBe(400);
    expect(
      (await POST(request({ password: "a".repeat(16), confirmed: true, userId: "other" }))).status,
    ).toBe(400);
    expect(mocks.bootstrap).not.toHaveBeenCalled();
  });

  it("does not log or return the password on success", async () => {
    const secret = "PRIVATE-secret-value-123";
    const log = vi.spyOn(console, "log");
    const error = vi.spyOn(console, "error");
    const response = await POST(request({ password: secret, confirmed: true }));
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain(secret);
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(mocks.bootstrap).toHaveBeenCalledWith(secret);
    expect(mocks.requireRole).toHaveBeenCalledWith("administrator");
  });

  it("returns only a generic safe error when the Auth update fails", async () => {
    const secret = "PRIVATE-secret-value-123";
    mocks.bootstrap.mockRejectedValue(new Error(`provider rejected ${secret}`));
    const response = await POST(request({ password: secret, confirmed: true }));
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(text).not.toContain(secret);
    expect(text).not.toContain("provider rejected");
  });
});
