# Ariel of the Shahnameh

A browser RTS campaign prototype based on the supplied **Ariel of the Shahnameh - Story and Levels.docx**. The former Kaveh-only scenario is now memory 6 in a 62-memory, nine-act campaign.

## Current implementation

- Campaign browser with the document's exact level titles, ordering, mission descriptions and age limits.
- Ariel as the recurring playable guardian; the frame story is his account to Ferdowsi in Tus.
- Four ages: Fire, Iron, Heroes and Myth. Three patron choices at every advancement, passive bonuses and one-use powers.
- Food, wood, gold and Glory. Priests pray at Temples. Hunting, herd and fishing resource nodes supplement berries and farms.
- Ariel can transfer a 20% blessing between buildings. It speeds production, research, farm work and prayer.
- Added Blacksmith, Archery Range, Market, Wall, Library, Observatory, Nest and Wonder. Market exchanges and caravans work.
- All 62 memories have executable objective chains (194 stages): defence, building, resource commitments, capture, rescue, escort, trade, duels, limited sight, famine, court favor, succession and scripted events.
- Local campaign unlocks and mission snapshots, manual save and automatic save. Replay completed memories. Scripted tragedies progress the story; ordinary defeats retry the current memory.
- Opening Kayumars scenario starts with a mountain-backed cave settlement, five villagers, six defenders, housing, storage and a farm. Unlimited preparation precedes three beginner waves of 3/5/7 weakened enemies. Timber defences and stone defenders remain within the first age. Later waves gain numbers and enemy strength gradually across the campaign.

## Production limits

This is a systems and scenario prototype, not 62 finished commercial-quality levels. Scenarios reuse the original plateau terrain and several existing character/building models. Named beasts, later heroes, Wonders, naval travel, city layouts, trial-specific puzzles, stealth, the rival claimant and court politics still need bespoke art and deeper mechanics. Some narrative events currently use prose with objective transitions. The chess challenge is introductory, not a full chess implementation. The last stand is represented by survival followed by a scripted ending.

Runtime checks exercise objective progression with controlled fixtures, rendering and save restoration. They do not establish campaign playing time or difficulty balance. All levels need normal-speed playtesting before release.

## Source and build

`campaign-data.json` preserves the supplied document's 62 level rows. `campaign.js` contains the campaign systems and mission chains. `build-campaign.cjs` embeds both into `index.html`, so the existing standalone distribution and local server still work.

Run `node build-campaign.cjs` after changing the campaign source. Open `index.html` in a browser or serve the repository. Three.js currently loads from a CDN.

The previous prototype's character and story art remains in `assets/`. New frame art is `assets/story/ariel-ferdowsi.webp`.

## Narrative authority

The supplied document controls this adaptation. Ariel, his immortality and the recurring Whisperer are original connecting fiction, not claims about Ferdowsi's text. Its 62-level division is an editorial game structure, not an official fixed division of the poem. To bridge the years between the last king and Ferdowsi, this prototype has Sorush carry mortal Ariel forward to Tus; this is a provisional interpretation pending the user's preference.
