/**
 * Live smoke test against the public Evand API.
 *
 * Usage: npm run smoke
 * This is not part of the unit test suite because it requires network access and
 * depends on Evand's live data.
 */
import { EvandClient, parseEventSlug } from "../src/evand.js";

function heading(text: string): void {
  console.log(`\n=== ${text} ===`);
}

async function main(): Promise<void> {
  const client = new EvandClient({ debug: process.env.EVAND_MCP_DEBUG === "1" });

  heading("search_events");
  const search = await client.searchEvents({ query: "هوش مصنوعی", per_page: 3 });
  console.log(
    `${search.events.length} of ${search.pagination.total ?? "?"} result(s), sort=${search.filters.sort}`,
  );
  for (const event of search.events) {
    console.log(`- ${event.name} | ${event.start_date_tehran} | ${event.price.display} | ${event.slug}`);
  }
  const first = search.events[0];
  if (!first) throw new Error("Search returned no events; cannot continue smoke test.");

  heading("get_event");
  const event = await client.getEvent(parseEventSlug(first.slug), { maxDescriptionChars: 300 });
  console.log(`- ${event.name}`);
  console.log(`- category: ${event.category?.path.join(" → ") ?? "none"}`);
  console.log(`- city: ${event.city ?? "online"}, venue: ${event.address ?? "-"}`);
  console.log(`- tickets: ${event.tickets.length}, showtimes: ${event.showtimes.length}`);
  console.log(`- ticket summary: ${JSON.stringify(event.ticket_summary)}`);
  console.log(`- description: ${event.description?.text.length ?? 0} chars (truncated=${event.description?.truncated})`);

  heading("get_similar_events");
  const similar = await client.getSimilarEvents(first.slug, 3);
  for (const item of similar) {
    console.log(`- ${item.name} (${item.slug})`);
  }

  heading("list_cities");
  const cities = await client.listCities(undefined, 5);
  console.log(`total with events: ${cities.total}`);
  for (const city of cities.cities) {
    console.log(`- ${city.name} (${city.slug}) — ${city.events_count} events`);
  }

  heading("list_categories");
  const categories = await client.listCategories("هوش", 5);
  console.log(`total matches: ${categories.total}`);
  for (const category of categories.categories) {
    console.log(`- ${category.title} (${category.slug}) — parent: ${category.parent ?? "none"}`);
  }

  heading("search_organizations");
  const organizations = await client.searchOrganizations({ query: "ابرها", per_page: 3 });
  for (const organization of organizations.organizations) {
    console.log(
      `- ${organization.name} (${organization.slug}) — ${organization.followers_count ?? "?"} followers`,
    );
  }

  const organization = organizations.organizations[0];
  if (organization) {
    heading("get_organization");
    const detail = await client.getOrganization(organization.slug, {
      eventsLimit: 2,
      maxDescriptionChars: 200,
    });
    console.log(`- ${detail.name}: ${detail.events.length} event(s)`);
    for (const item of detail.events) {
      console.log(`  - ${item.name} | ${item.start_date_tehran}`);
    }
  }

  console.log("\nSmoke test completed successfully.");
}

main().catch((error: unknown) => {
  console.error("\nSmoke test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
