# Kaveh's Banner — visual direction

## Target

A readable, nostalgic 3D strategy game rooted in the Shahnameh: sunlit stone and dry earth, lapis and turquoise glaze, iron, crimson standards, and the darker volcanic territory of Zahhak. The aim is the production quality and visual clarity of a modern mythology RTS, with original Persian designs rather than copied game assets.

## This prototype pass

The HTML prototype now has warmer key lighting with cooler fill, more useful contrast in its stone foundations, individually placed flagstones along the major routes, grounded unit silhouettes, and more architectural detail on houses. All new path geometry is instanced and deterministic.

## Production art needed for a full release

1. **Terrain:** sculpted terrain materials with authored albedo, normal and roughness maps, road transitions, riverbank meshes, and authored landmarks. Use texture atlases and distance based detail to stay within mobile budgets.
2. **Buildings:** distinct silhouettes for each age and faction, modeled from Persian architectural references. Add damaged and construction states, modular trim, doors, props, and baked ambient occlusion.
3. **Characters:** consistent proportions and silhouettes at RTS zoom. Sculpt, retopologize, rig, and animate Kaveh, Fereydun, villagers, troops, Div, Zahhak, and Simurgh. Create team color masks and readable combat effects.
4. **Lighting and effects:** time of day palette, shadow quality tiers, subtle dust and smoke, controlled bloom for fire and god powers, and a color grading pass. Test on actual target phones before fixing effects budgets.
5. **Interface:** high resolution portraits, individually illustrated command icons, map markers, and a coherent carved stone / bronze component set. Preserve the current compact landscape layout.

## Implementation note

The current game generates its assets and textures in one HTML file. This pass improves that renderer, but authored 3D assets and a mobile engine build are required to reach a modern commercial game's asset quality. The README's Unity plan is an appropriate place for the production asset pipeline.
