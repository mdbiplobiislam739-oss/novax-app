async function test() {
  try {
    const dates = ['20260627', '20260628', '20260629', '20260630'];
    const promises = dates.map(d => fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?dates=${d}`).then(r => r.json()).catch(() => null));
    const results = await Promise.all(promises);
    results.forEach((data, i) => {
        if(data && data.events) {
            console.log(`Date ${dates[i]}:`, data.events.map((e: any) => ({ name: e.name, state: e.status.type.state, date: e.date })));
        }
    });
  } catch (e) { console.error(e); }
}
test();
