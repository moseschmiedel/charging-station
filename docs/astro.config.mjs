// @ts-check

import starlight from "@astrojs/starlight";
import astroD2 from "astro-d2";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkMath from "remark-math";
import starlightThemeNova from "starlight-theme-nova";
import { getCodeReferenceSidebarItems } from "./src/lib/code-reference-sidebar.mjs";
import { SYNTAX_THEMES } from "./syntax-highlighting.config.mjs";

const [githubOwner, githubRepo] = (process.env.GITHUB_REPOSITORY ?? "").split(
	"/",
);
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const codeProjectSidebarItems = getCodeReferenceSidebarItems();

// https://astro.build/config
export default defineConfig({
	site: githubOwner ? `https://${githubOwner}.github.io` : undefined,
	base: isGitHubActions && githubRepo ? `/${githubRepo}` : undefined,
	markdown: {
		syntaxHighlight: {
			type: "shiki",
			excludeLangs: ["mermaid", "math", "d2"],
		},
		remarkPlugins: [remarkMath],
		rehypePlugins: [
			[rehypeExternalLinks, { target: "_blank" }],
			rehypeMermaid,
			rehypeKatex,
		],
	},
	integrations: [
		astroD2({
			experimental: {
				useD2js: true,
			},
		}),
		starlight({
			plugins: [starlightThemeNova()],
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
					label: "Home",
					slug: "",
				},
				{
					label: "Guides",
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: "Getting Started", slug: "guides/getting-started" },
					],
				},
				{
					label: "Reference",
					autogenerate: { directory: "reference" },
				},
				{
					label: "Code Reference",
					items: codeProjectSidebarItems,
				},
			],
		}),
	],
});
