// @ts-check

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import rehypeMermaid from "rehype-mermaid";

// https://astro.build/config
export default defineConfig({
	markdown: {
		rehypePlugins: [[rehypeExternalLinks, { target: "_blank" }], rehypeMermaid],
	},
	integrations: [
		starlight({
			title: "Charging Station Documentation",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/moseschmiedel/charging-station",
				},
			],
			sidebar: [
				{
					label: "Guides",
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: "Getting Started", slug: "guides/getting-started" },
						{
							label: "Beacon Tracking + Drive Control",
							slug: "guides/beacon-tracking-drive-control",
						},
					],
				},
				{
					label: "Reference",
					autogenerate: { directory: "reference" },
				},
			],
		}),
	],
});
