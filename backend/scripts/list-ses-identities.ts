import "dotenv/config";
import { ListEmailIdentitiesCommand, GetEmailIdentityCommand } from "@aws-sdk/client-sesv2";
import sesClient from "../utils/ses-client";

async function main() {
  try {
    const res = await sesClient.send(new ListEmailIdentitiesCommand({}));
    console.log("Verified SES Identities:", res.EmailIdentities);
    for (const ident of res.EmailIdentities || []) {
      const details = await sesClient.send(new GetEmailIdentityCommand({ EmailIdentity: ident.IdentityName }));
      console.log(`Identity [${ident.IdentityName}]:`, JSON.stringify(details, null, 2));
    }
  } catch (err: any) {
    console.error("Error listing identities:", err.message);
  }
  process.exit(0);
}
main();
