import type {
    ActionFunctionArgs
} from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { deleteSong } from "../data";

export const action = async ({
    params,
    context,
}: ActionFunctionArgs) => {
    invariant(params.id, "Missing contactId param");
    const db = context.cloudflare.env.DB
    await deleteSong(db, params.id);
    return redirect(`/`);
};

