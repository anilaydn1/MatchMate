import { signIn } from "@clerk/clerk-react";

export const handleLogin = async (email, password) => {
  try {
    const user = await signIn({ email, password });
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
