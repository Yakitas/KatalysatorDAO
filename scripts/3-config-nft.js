import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

const bundleDrop = sdk.getBundleDropModule(
  "0x246A29D969FC5f43770B6C26C9A4Db105234C4ad",
);

(async () => {
  try {
    await bundleDrop.createBatch([
      {
        name: "Kattt Super Card",
        description: "Deze NFT geeft je toegang tot KatalysatorDAO!",
        image: readFileSync("scripts/assets/KatttDAO.png"),
      },
    ]);
    console.log("✅ Successfully created a new NFT in the drop!");
  } catch (error) {
    console.error("failed to create the new NFT", error);
  }
})()