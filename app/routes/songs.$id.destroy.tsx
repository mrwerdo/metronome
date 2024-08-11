import type {
    ActionFunctionArgs
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { deleteMetronome } from "../data";

export const action = async ({
    params,
    request,
}: ActionFunctionArgs) => {
    invariant(params.contactId, "Missing contactId param");
    await deleteMetronome(params.contactId);
    return redirect(`/`);
};

