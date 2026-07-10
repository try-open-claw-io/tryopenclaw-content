---
name: humanizer
description: Edit text to remove the tells of AI-generated writing and make it read like a real person wrote it. Run as a final pass on any draft (blog, caption, email, landing copy, case study, newsletter) before handing it to the user. Based on Wikipedia's "Signs of AI writing". Use when finishing a piece of content, or when the user says the copy "sounds like AI / máy viết / cứng / sáo". Not a content generator — it rewrites text that already exists.
---

Final-pass editor that strips AI-writing patterns and injects real human voice. Based on Wikipedia's "Signs of AI writing" (WikiProject AI Cleanup). Run it on a draft, not on a blank page.

## Required environment

No API key required. Pure text editing, runs locally.

## Task

Given a draft:

1. Scan for the patterns below.
2. Rewrite each problematic section into a natural alternative.
3. Preserve meaning and the intended tone.
4. Add actual personality — clean-but-voiceless is still slop.
5. Return the rewritten text (and, only if useful, a one-line note on what changed).

## Personality and soul

Removing bad patterns is half the job. Sterile, voiceless text is just as obvious as slop. Signs of soulless writing even when "clean": every sentence the same length, no opinions, no acknowledgment of mixed feelings, no first person where it fits, no edge, reads like a press release.

How to add voice:

- Have opinions. React to facts, don't just report them.
- Vary rhythm. Short punchy sentence. Then a longer one that takes its time.
- Acknowledge complexity — real people have mixed feelings.
- Use "I/you" when it fits; first person is honest, not unprofessional.
- Be specific about feelings: not "this is concerning" but the concrete thing that bothers you.

## Content patterns to remove

1. **Inflated significance / legacy / broader trends** — "stands as / is a testament / plays a pivotal role / marks a turning point / evolving landscape / setting the stage for / reflects a broader". Cut the puffery, state the fact.
2. **Undue notability / media coverage** — listing outlets and follower counts. Replace with one concrete, sourced fact.
3. **Superficial "-ing" analyses** — "highlighting…, ensuring…, reflecting…, showcasing…" tacked on for fake depth. Delete or make concrete.
4. **Promotional language** — "boasts, vibrant, rich, nestled, in the heart of, breathtaking, must-visit, renowned, stunning". Neutral, specific description instead.
5. **Vague attributions / weasel words** — "Experts argue, Observers have cited, Industry reports". Name the actual source or drop the claim.
6. **Formulaic "Challenges and Future Prospects" sections** — "Despite its… faces several challenges… Despite these challenges…". Replace with specifics.
7. **AI vocabulary** — Additionally, align with, crucial, delve, emphasizing, enduring, enhance, fostering, garner, highlight, interplay, intricate, key (adj.), landscape (abstract), pivotal, showcase, tapestry, testament, underscore, valuable, vibrant, seamless, leverage, elevate, unlock. In Vietnamese content, the same reflex shows as "giải pháp toàn diện hàng đầu, tối ưu hóa, tiên tiến nhất, đột phá" — cut it too.
8. **Copula avoidance** — "serves as / stands as / represents / boasts / features". Use is / are / has.
9. **Negative parallelism** — "Not only… but…", "It's not just X, it's Y". Say the thing plainly.
10. **Rule of three** — forced groups of three ("innovation, inspiration, and insights"). Break the pattern.
11. **Elegant variation** — cycling synonyms for the same noun (protagonist → main character → central figure → hero). Just repeat the word.
12. **False ranges** — "from X to Y" where X and Y aren't on a scale. List the actual items.

## Style patterns to remove

13. **Em-dash overuse** — LLMs overuse "—". Prefer commas or periods; keep an em dash only where it truly earns it.
14. **Boldface spam** — emphasizing phrases mechanically. Remove most bold.
15. **Inline-header vertical lists** — "- **Thing:** explanation" repeated. This is the loudest AI tell. Convert to prose, or a plain list only when the content genuinely is a list.
16. **Title Case In Headings** — use sentence case.
17. **Emoji-decorated headings/bullets** — remove.
18. **Curly quotes** — use straight quotes " ' not " ' ' '.

## Communication patterns to remove

19. **Chatbot artifacts** — "Here is…, I hope this helps, Certainly!, Would you like me to…, let me know". Delete.
20. **Knowledge-cutoff disclaimers** — "as of my last update, while specific details are limited…". Delete or replace with the actual fact.
21. **Sycophantic tone** — "Great question! You're absolutely right!". Delete.
22. **Filler phrases** — "in order to" → "to", "due to the fact that" → "because", "at this point in time" → "now", "has the ability to" → "can".
23. **Excessive hedging** — "it could potentially possibly be argued that…" → "…".
24. **Generic upbeat conclusions** — "The future looks bright… exciting times ahead". Replace with a concrete next fact or cut.

## Full example

Before: *"The new update serves as a testament to our commitment to innovation. Moreover, it provides a seamless, intuitive, and powerful experience—ensuring users hit their goals. It's not just an update, it's a revolution. Industry experts believe it will have a lasting impact, highlighting our pivotal role in the evolving landscape."*

After: *"The update adds batch processing, keyboard shortcuts, and offline mode. Beta testers say tasks finish faster."*

## Guardrails

- Editing only. Do not add facts, stats, quotes, or claims that were not in the source — humanizing must never introduce fabrication. If the source lacks a needed fact, leave a `[[NEEDS SOURCE: ...]]` marker rather than inventing one.
- Preserve the author's meaning and any confirmed brand voice. Do not flatten a deliberate style into generic neutral.
- Output the rewritten text as the deliverable — do not wrap it in a labelled analysis template.

## Reference

Based on [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). Key insight: LLMs pick the most statistically likely next token, which trends toward the blandest phrasing that fits the widest range of cases. Humanizing is the deliberate move away from that average.
