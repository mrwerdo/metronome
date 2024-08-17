import type {
    ActionFunctionArgs
} from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { deleteMetronome } from "../data";

export const action = async ({
    params,
    context,
}: ActionFunctionArgs) => {
    console.log(params);
    invariant(params.id, "Missing contactId param");
    const db = context.cloudflare.env.DB
    await deleteMetronome(db, params.id);
    return redirect(`/`);
};

