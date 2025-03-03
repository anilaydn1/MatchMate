import { handleLogin } from "./utils/handleLogin";
import { signIn } from "@clerk/clerk-react";

jest.mock("@clerk/clerk-react", () => ({
  signIn: jest.fn(),
}));

describe("Clerk Login Function", () => {
  it("should return user data when login is successful", async () => {
    const mockUser = { id: "123", email: "test@gmail.com" };
    signIn.mockResolvedValue(mockUser);

    const result = await handleLogin("test@gmail.com", "password123");
    expect(result).toEqual({ success: true, user: mockUser });
    expect(signIn).toHaveBeenCalledWith({ email: "test@gmail.com", password: "password123" });
  });

  it("should return an error message when login fails", async () => {
    const mockError = new Error("Invalid credentials");
    signIn.mockRejectedValue(mockError);

    const result = await handleLogin("wrong@gmail.com", "wrongpassword");
    expect(result).toEqual({ success: false, error: "Invalid credentials" });
    expect(signIn).toHaveBeenCalledWith({ email: "wrong@gmail.com", password: "wrongpassword" });
  });
});
