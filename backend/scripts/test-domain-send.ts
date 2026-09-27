import "dotenv/config";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import sesClient from "../utils/ses-client";

async function main() {
  try {
    const res = await sesClient.send(
      new SendEmailCommand({
        FromEmailAddress: "ScholarPro <noreply@scholarpro.site>",
        Destination: { ToAddresses: ["rangsey.virak@camtech.edu.kh", "virakrangsey@gmail.com"] },
        Content: {
          Simple: {
            Subject: { Data: "ScholarPro Invitation Test", Charset: "UTF-8" },
            Body: {
              Html: {
                Data: "<h1>ScholarPro Invitation</h1><p>This is a test from noreply@scholarpro.site</p>",
                Charset: "UTF-8",
              },
              Text: { Data: "This is a test from noreply@scholarpro.site", Charset: "UTF-8" },
            },
          },
        },
      })
    );
    console.log("Sent with scholarpro.site:", res);
  } catch (err: any) {
    console.error("Error sending from scholarpro.site:", err);
  }
  process.exit(0);
}
main();
