// @ts-check

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkMath from "remark-math";
import { SYNTAX_THEMES } from "./syntax-highlighting.config.mjs";

const [githubOwner, githubRepo] = (process.env.GITHUB_REPOSITORY ?? "").split(
	"/",
);
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

// https://astro.build/config
export default defineConfig({
	site: githubOwner ? `https://${githubOwner}.github.io` : undefined,
	base: isGitHubActions && githubRepo ? `/${githubRepo}` : undefined,
	markdown: {
		shikiConfig: {
			themes: SYNTAX_THEMES,
		},
		remarkPlugins: [remarkMath],
		rehypePlugins: [
			[rehypeExternalLinks, { target: "_blank" }],
			rehypeMermaid,
			rehypeKatex,
		],
	},
	integrations: [
		starlight({
			title: "Charging Station Documentation",
			customCss: [
				"./src/styles/katex.css",
				"./src/styles/code-reference-syntax.css",
			],
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
				{
					label: "Code Projects",
					items: [
						{ label: "Master", link: "/reference/code/master/" },
						{ label: "Slave", link: "/reference/code/slave/" },
						{ label: "IR Meter", link: "/reference/code/ir_meter/" },
						{ label: "Motor", link: "/reference/code/motor/" },
						{ label: "Dezibot", link: "/reference/code/dezibot/" },
					],
				},
			],
		}),
	],
});
