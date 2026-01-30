import "dotenv/config";

async function getAnalyticsSummary() {
    const projectId = "YMC1RxkwmxWN";
    const apiKey = "f457c1b2-392f-4729-bc24-708c0d2cb4c6";
    const apiBase = "https://analytics-api.raydoug.com/backend/v1";

    if (!projectId) {
        console.error("❌ NEXT_PUBLIC_SWETRIX_PROJECT_ID not found in environment.");
        return;
    }

    console.log(`\n📊 Fetching Analytics Summary for: ${projectId}\n`);

    try {
        // 1. Fetch Birdseye (General Overview)
        const birdseyeResponse = await fetch(
            `${apiBase}/log/birdseye?pid=${projectId}&period=today`,
            {
                headers: { "X-Api-Key": apiKey },
            }
        );

        // 2. Fetch Performance Stats
        const perfResponse = await fetch(
            `${apiBase}/log/performance?pid=${projectId}&period=today&timeBucket=hour`,
            {
                headers: { "X-Api-Key": apiKey },
            }
        );

        if (!birdseyeResponse.ok || !perfResponse.ok) {
            throw new Error(`API returned error: ${birdseyeResponse.status} / ${perfResponse.status}`);
        }

        const birdseyeData = await birdseyeResponse.json();
        const perfData = await perfResponse.json();

        const stats = birdseyeData[projectId];

        if (!stats) {
            console.log("📭 No data recorded for today yet.");
            return;
        }

        const { current, change, uniqueChange } = stats;

        console.log("📈 Traffic (Today)");
        console.log(`------------------`);
        console.log(`Total Visits: ${current.all} (${change >= 0 ? "+" : ""}${change}%)`);
        console.log(`Unique Users: ${current.unique} (${uniqueChange >= 0 ? "+" : ""}${uniqueChange}%)`);
        console.log(`Avg Duration: ${Math.round(current.sdur / 60)}m ${current.sdur % 60}s`);
        console.log(`Bounce Rate:  ${current.bounceRate}%`);

        console.log("\n⚡ Performance (Avg)");
        console.log(`------------------`);

        // Performance data is usually an array of time buckets
        if (perfData.performance && perfData.performance.length > 0) {
            const p = perfData.performance[0];
            console.log(`TTFB:        ${p.ttfb}ms`);
            console.log(`Render:      ${p.render}ms`);
            console.log(`DOM Load:    ${p.domLoad}ms`);
            console.log(`Total Load:  ${p.pageLoad}ms`);
        } else {
            console.log("No performance data for today yet.");
        }

        console.log("\n✅ Summary complete.");
    } catch (error) {
        console.error("❌ Failed to fetch analytics:", error instanceof Error ? error.message : String(error));
    }
}

getAnalyticsSummary();
