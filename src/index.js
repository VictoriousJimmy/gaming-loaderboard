import { createApp } from "@deroll/app";
import { getAddress, hexToString, stringToHex } from "viem";

const app = createApp({ url: process.env.ROLLUP_HTTP_SERVER_URL || "http://127.0.0.1:5004" });

let leaderboard = {};

app.addAdvanceHandler(async ({ metadata, payload }) => {
    const sender = getAddress(metadata.msg_sender);
    const payloadString = hexToString(payload);
    console.log("Sender:", sender, "Payload:", payloadString);

    try {
        const jsonPayload = JSON.parse(payloadString);

        if (jsonPayload.method === "submit_score") {
            const score = parseInt(jsonPayload.score);
            if (!leaderboard[sender] || leaderboard[sender] < score) {
                leaderboard[sender] = score;
                console.log(`Updated leaderboard for ${sender}: ${score}`);
            }
        }
        return "accept";
    } catch (e) {
        console.error(e);
        app.createReport({ payload: stringToHex(String(e)) });
        return "reject";
    }
});

app.addInspectHandler(async ({ payload }) => {
    const url = hexToString(payload).split("/"); // e.g., "rollup/leaderboard/0x1234..."
    console.log("Inspect call:", url);
    
    if (url[1] === "leaderboard") {
        const address = getAddress(url[2]);
        const score = leaderboard[address] || 0;
        await app.createReport({ payload: stringToHex(String(score)) });
    } else {
        console.log("Invalid inspect call");
        await app.createReport({ payload: stringToHex("Invalid inspect call") });
    }
});

app.start().catch((e) => {
    console.error(e);
    process.exit(1);
});
