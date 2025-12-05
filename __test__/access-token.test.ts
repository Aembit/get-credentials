import { setupServer } from "msw/node";
import { v4 as uuidv4 } from "uuid";
import { afterAll, afterEach, beforeAll, describe, it } from "vitest";
import { getAccessToken } from "../src/access-token";
import {
  edgeApiAuthHandler,
  edgeApiGetCredentialsHandlerResponse400,
  edgeApiGetCredentialsHandlerResponse500,
} from "./gen/handlers";

const server = setupServer(edgeApiAuthHandler());

// We validate these values in other functions prior to this call in main, so assume they are correct in these tests.
const reqBody = {
  clientId: `aembit:useast2:a12345:identity:github_idtoken:${uuidv4()}`,
  idToken:
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlcjAxIiwiYXVkIjpbIjEyODk4ODg0NTk2ODYzIl0sImlzcyI6Imh0dHBzOi8vYXV0aGxldGUuY29tIiwiZXhwIjoxNTU5MTA2ODE1LCJpYXQiOjE1NTkwMjA0MTUsIm5vbmNlIjoibi0wUzZfV3pBMk1qIn0.5uSFMTGnubyvtiExHc9l7HT9UsF8a_Qb0STtWzyclBk",
  domain: "aembit.io",
};

describe("getAccessToken", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("returns a token when called with valid data", async ({ expect }) => {
    server.use(edgeApiAuthHandler({ accessToken: "abcde12345" }));
    const token = await getAccessToken(
      reqBody.clientId,
      reqBody.idToken,
      reqBody.domain,
    );
    expect(token).toBe("abcde12345");
  });

  it("throws an error when receiving a 400 response", async ({ expect }) => {
    server.use(edgeApiAuthHandler(edgeApiGetCredentialsHandlerResponse400));
    await expect(
      getAccessToken(reqBody.clientId, reqBody.idToken, reqBody.domain),
    ).rejects.toThrowError();
  });

  it("throws an error when receiving a 500 response", async ({ expect }) => {
    server.use(edgeApiAuthHandler(edgeApiGetCredentialsHandlerResponse500));
    await expect(
      getAccessToken(reqBody.clientId, reqBody.idToken, reqBody.domain),
    ).rejects.toThrowError();
  });

  it("throws an error when receiving a response lacking an accessToken", async ({
    expect,
  }) => {
    server.use(edgeApiAuthHandler({ accessToken: undefined }));
    await expect(
      getAccessToken(reqBody.clientId, reqBody.idToken, reqBody.domain),
    ).rejects.toThrowError();
  });
});
