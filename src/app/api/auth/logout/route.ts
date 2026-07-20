import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete("np_session");
  response.cookies.delete("np_user");

  return response;
}
