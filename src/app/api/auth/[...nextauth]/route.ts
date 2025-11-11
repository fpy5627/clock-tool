import { handlers } from "@/auth";

const { GET: originalGET, POST: originalPOST } = handlers;

export const GET = async (req: Request, context: any) => {
  const response = await originalGET(req, context);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
};

export const POST = async (req: Request, context: any) => {
  const response = await originalPOST(req, context);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
};
