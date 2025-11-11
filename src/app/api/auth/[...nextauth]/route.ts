import { handlers } from "@/auth";

const { GET: originalGET, POST: originalPOST } = handlers;

export const GET = async (req: Request) => {
  const response = await originalGET(req);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
};

export const POST = async (req: Request) => {
  const response = await originalPOST(req);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
};
