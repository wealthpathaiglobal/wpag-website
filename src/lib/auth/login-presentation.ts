export type LoginAudience = "administrator" | "participant" | "account";

export function getLoginAudience(next: string | null): LoginAudience {
  if (next?.startsWith("/admin")) {
    return "administrator";
  }

  if (next?.startsWith("/participant")) {
    return "participant";
  }

  return "account";
}

export function getLoginPresentation(next: string | null) {
  const audience = getLoginAudience(next);

  if (audience === "administrator") {
    return {
      contextLabel: "Administrator access",
      heading: "Your protected staff workspace.",
      description:
        "Use this secure sign-in to access the WPAG administration workspace. Staff authorization is verified after sign-in.",
      buttonLabel: "Sign in to Administration",
      accessNote:
        "Access is limited to authorized WPAG staff accounts. This page does not create a new account.",
    };
  }

  if (audience === "participant") {
    return {
      contextLabel: "Participant Portal",
      heading: "Your private participant workspace.",
      description:
        "Use this protected sign-in to view your participant information and the activities currently available to you.",
      buttonLabel: "Sign in to Participant Portal",
      accessNote:
        "Participant access is provided directly by WPAG. This page does not create a new account.",
    };
  }

  return {
    contextLabel: "Secure account access",
    heading: "Your protected WPAG workspace.",
    description:
      "Use this secure sign-in for an authorized WPAG participant or staff account.",
    buttonLabel: "Sign in securely",
    accessNote:
      "Access is limited to authorized WPAG accounts. This page does not create a new account.",
  };
}
