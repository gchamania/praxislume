type AuthActionStatus = "saving" | "error";

type AuthActionHandlers = {
  setStatus(status: AuthActionStatus): void;
  setMessage(message: string | undefined): void;
};

export async function runAuthAction(task: () => Promise<void>, handlers: AuthActionHandlers): Promise<boolean> {
  handlers.setStatus("saving");
  handlers.setMessage(undefined);
  try {
    await task();
    return true;
  } catch (error) {
    handlers.setStatus("error");
    handlers.setMessage(authErrorMessage(error));
    return false;
  }
}

function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unable to sign in. Please check your details and try again.";
}
